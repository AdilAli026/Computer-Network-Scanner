import asyncio
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import ipaddress
import platform
import re
import socket
import sqlite3
import subprocess
import time
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psutil
from fastapi import Request
class DeviceName(BaseModel):
    name: str

# Intialization and Ending of the Program

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("FastAPI started!")

    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            cpu REAL,
            ram REAL,
            download REAL,
            upload REAL
        )
    """)
    cursor.execute("""
            CREATE TABLE IF NOT EXISTS device_names (
                device_id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            mac TEXT,
            ip TEXT,
            hostname TEXT
        )
    """)
    cursor.execute("DELETE FROM stats")
    connection.commit()
    connection.close()

    yield

    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()

    cursor.execute("""
        DELETE FROM devices
        WHERE hostname IS NULL OR hostname = ''
    """)
    cursor.execute("""
        DELETE FROM stats
    """)
    connection.commit()
    connection.close()
    print("FastAPI shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Device Recognition Functions (Fingerprinting)
def get_network_name():
    result = subprocess.run(
        ["netsh", "wlan", "show", "interfaces"],
        capture_output=True,
        text=True
    )

    for line in result.stdout.splitlines():
        if "SSID" in line and "BSSID" not in line:
            return line.split(":", 1)[1].strip()

    return "Unknown Network"

def resolve_device(ip, mac, hostname):
    if not mac and not hostname:
        return None

    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()
    device_id = None

    if mac:
        cursor.execute(
            "SELECT id FROM devices WHERE mac = ?",
            (mac,)
        )
        row = cursor.fetchone()

        if row:
            device_id = row[0]

    if hostname:
        if not device_id and hostname not in ["localhost", "127.0.0.1"]:
            cursor.execute(
                "SELECT id FROM devices WHERE hostname = ?",
                (hostname,)
            )
            rows = cursor.fetchall()

            if len(rows) == 1:
                device_id = rows[0][0]

    if not device_id:
        device_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO devices (id, mac, ip, hostname)
            VALUES (?, ?, ?, ?)
        """, (device_id, mac, ip, hostname))

    else:
        cursor.execute("""
            UPDATE devices
            SET mac = ?, ip = ?, hostname = ?
            WHERE id = ?
        """, (mac, ip, hostname, device_id))

    connection.commit()
    connection.close()
    return device_id

def get_saved_name(device_id):
    if not device_id:
        return None
    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()
    cursor.execute("SELECT name FROM device_names WHERE device_id = ?", (device_id,))
    result = cursor.fetchone()
    connection.close()
    return result[0] if result else None

def get_known_devices():
    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()
    cursor.execute("SELECT id, mac, ip, hostname FROM devices")
    rows = cursor.fetchall()
    connection.close()
    return rows

# Graph / Info Logging functions

def save_stats(date, cpu, ram, download, upload):

    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO stats (timestamp, cpu, ram, download, upload)
        VALUES (?, ?, ?, ?, ?)
    """, (date, cpu, ram, download, upload))

    cursor.execute("""
        DELETE FROM stats
        WHERE rowid NOT IN (
            SELECT rowid
            FROM stats
            ORDER BY rowid DESC
            LIMIT 40
        )
    """)

    connection.commit()
    connection.close()

# Additional Network Functions
def get_gateway():
    result = subprocess.run(
        ["route", "print", "0.0.0.0"],
        capture_output=True,
        text=True
    )

    for line in result.stdout.splitlines():
        parts = line.split()

        if len(parts) >= 5 and parts[0] == "0.0.0.0":
            return parts[2]

    return None


def check_host(ip):
    start = time.perf_counter()
    result = subprocess.run(
        ["ping", "-n", "1", "-w", "500", str(ip)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    end = time.perf_counter()

    if result.returncode == 0:
        return {
            "ip": str(ip),
            "response_time_ms": round((end - start) * 1000, 2)
        }
    return None

def get_mac(ip):
    result = subprocess.run(
        ["arp", "-a", str(ip)],
        capture_output=True,
        text=True
    )
    match = re.search(r"([0-9a-fA-F]{2}[-:]){5}[0-9a-fA-F]{2}", result.stdout)
    return match.group(0) if match else None

def get_hostname(ip):
    try:
        return socket.gethostbyaddr(str(ip))[0]
    except socket.herror:
        return None

def get_device_info(result):
    ip = result["ip"]
    mac = get_mac(ip)
    hostname = get_hostname(ip)
    device_id = resolve_device(ip, mac, hostname)

    return {
        "id": device_id,
        "ip": ip,
        "mac": mac,
        "hostname": hostname,
        "name": get_saved_name(device_id),
        "status": "Online",
        "response_time_ms": result["response_time_ms"]
    }

def build_device_list(online_devices):
    online_ids = {dev["id"] for dev in online_devices if dev.get("id")}
    known_devices = get_known_devices()
    devices = list(online_devices)

    for device_id, mac, ip, hostname in known_devices:
        if device_id not in online_ids:
            devices.append({
                "id": device_id,
                "ip": ip,
                "mac": mac,
                "hostname": hostname,
                "name": get_saved_name(device_id),
                "status": "Offline",
                "response_time_ms": None
            })
    return devices

# API ENDPOINTS 

@app.get("/api/status")
def status():
    return {"status": "working"}

@app.get("/api/networkname")
def networkname():
    return {"Network":get_network_name()}



@app.get("/api/network")
def network():
    interfaces = psutil.net_if_addrs()
    for interface, addresses in interfaces.items():
        for address in addresses:
            if address.family == socket.AF_INET:
                if address.address in ["127.0.0.1"] or address.address.startswith("169.254."):
                    continue
                net = ipaddress.IPv4Network(f"{address.address}/{address.netmask}", strict=False)
                return {
                    "interface": interface,
                    "ip": address.address,
                    "netmask": address.netmask,
                    "network": str(net)
                }
    return {"error": "No suitable network found"}

@app.get("/api/devices")
def devices():
    interfaces = psutil.net_if_addrs()
    for interface, addresses in interfaces.items():
        for address in addresses:
            if address.family == socket.AF_INET:
                if address.address in ["127.0.0.1"] or address.address.startswith("169.254."):
                    continue

                local_network = ipaddress.IPv4Network(
                    f"{address.address}/{address.netmask}", strict=False
                )
                hosts = list(local_network.hosts())

                with ThreadPoolExecutor(max_workers=50) as executor:
                    scan_results = executor.map(check_host, hosts)

                with ThreadPoolExecutor(max_workers=50) as executor:
                    device_results = executor.map(
                        get_device_info,
                        [res for res in scan_results if res is not None]
                    )
                    results = list(device_results)
                    device_list = build_device_list(results)

                    return {
                        "total_hosts": len(hosts),
                        "devices_found": len(results),
                        "devices": device_list
                    }
    return {"error": "No suitable network found"}

@app.get("/api/internet")
def internet_status():
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=2)
        return {"internet": True, "status": "Online"}
    except OSError:
        return {"internet": False, "status": "Offline"}

@app.get("/api/system")
def system_info():
    memory = psutil.virtual_memory()
    gpu_result = subprocess.run(
        [
            "powershell",
            "-Command",
            "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"
        ],
        capture_output=True,
        text=True
    )
    gpus = gpu_result.stdout.strip().splitlines()

    return {
        "cpu": {
            "name" : platform.processor(),
            "usage_percent": psutil.cpu_percent(interval=0.5),
            "cores": psutil.cpu_count(logical=True),
            "threads": psutil.cpu_count(logical=True),
        },
        "memory": {
            "total_gb": round(memory.total / (1024 ** 3), 2),
            "used_gb": round(memory.used / (1024 ** 3), 2),
            "usage_percent": memory.percent
        },
        "system": {
            "platform": platform.system(),
            "release": platform.release(),
            "architecture": platform.machine()
        },
        "GPU" :{
            "name" : gpus
        },
    }

@app.get("/api/bandwidth")
def bandwidth():
    first = psutil.net_io_counters()
    time.sleep(1)
    second = psutil.net_io_counters()
    download = second.bytes_recv - first.bytes_recv
    upload = second.bytes_sent - first.bytes_sent
    return {
        "download_mb": round(download / 1_000_000, 2),
        "upload_mb": round(upload / 1_000_000, 2)
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        while True:
            latency = 0
            gateway = get_gateway()
            if gateway:
                start = time.perf_counter()
                result = subprocess.run(
                    ["ping", "-n", "1", "-w", "500", gateway],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                end = time.perf_counter()
                if result.returncode == 0:
                    latency = round((end - start) * 1000, 2)




            first = psutil.net_io_counters()
            await asyncio.sleep(1)
            second = psutil.net_io_counters()
            download = second.bytes_recv - first.bytes_recv
            upload = second.bytes_sent - first.bytes_sent


            cpu = psutil.cpu_percent()
            ram = psutil.virtual_memory().percent
            download_mb = round(download / 1_000_000, 2)
            upload_mb = round(upload / 1_000_000, 2)

            save_stats(datetime.now().isoformat(), cpu, ram, download_mb, upload_mb)

            await websocket.send_json({
                "cpu": {
                    "usage_percent": cpu,
                    "cores": psutil.cpu_count(logical=True)
                },
                "memory": {
                    "total_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
                    "used_gb": round(psutil.virtual_memory().used / (1024 ** 3), 2),
                    "usage_percent": ram
                },
                "data": {
                    "download_mb": download_mb,
                    "upload_mb": upload_mb
                },
                "latency" : {
                    "ms" : latency
                },
            })
    except WebSocketDisconnect:
        print("Client Disconnected")

@app.get("/api/history")
def get_history():
    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()
    cursor.execute("""
        SELECT timestamp, cpu, ram, download, upload
        FROM stats
        ORDER BY id ASC
        LIMIT 300
    """)
    rows = cursor.fetchall()
    connection.close()
    return rows

@app.post("/api/rename")
async def rename_devices(request:Request):
    data = await request.json()
    id = data["id"]
    name = data["name"]
    connection = sqlite3.connect("monitor.db")
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO device_names (device_id, name)
        VALUES (?, ?)
        ON CONFLICT(device_id) DO UPDATE SET name = excluded.name
    """, (id,name))
    
    cursor.execute("SELECT * FROM device_names")
    print(cursor.fetchall())
    print("Rows changed:", cursor.rowcount)
    connection.commit()
    connection.close()