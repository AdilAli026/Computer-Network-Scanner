import { useState } from "react"
import { LoaderCircle,Radar } from "lucide-react";
import { RefreshCw } from "lucide-react";
function NetworkScanner({ devices, setdevices, scanned, setscanned ,dev,setdev}) {

    const [load,setload] = useState(false)
    const [bar,setbar] = useState(false)
    const [rename_id,set_rename_id] = useState(0)
    const [string,set_string] = useState("")

    const get_devices = async () => {
        setload(true)
        const response = await fetch("http://127.0.0.1:8000/api/devices")
        const data = await response.json()
        let count = 0

        for (let key in data)
            if (key == "devices")
                for (let i in data[key])
                    if (data[key][i]["status"] === "Online")
                        count += 1;


        setdevices(count)
        setload(false)
        setscanned(true)
        setdev(data.devices)
    }
    const send_device = async (id, name) => {
        await fetch("http://127.0.0.1:8000/api/rename", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                name: name
            })
        })
    }
    return (
        <>
            {scanned === false && load == false && (
                <button
                    className="button-scanner"
                    onClick={() => get_devices()}
                >
                    Scan Your Network
                </button>
            )}

            {scanned === false && load === true && (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="w-10 h-10 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-gray-500 text-sm">Scanning network...</span>
                </div>
            )}

            <div className="reload-container">
                {scanned === true && load === false && (
                    <button
                        className="reload-button"
                        onClick={() => {
                            setscanned(false)
                            setload(true)
                            get_devices()
                        }}
                    >
                        <RefreshCw className="reload-icon" size={22} />
                        <span className="reload-text">Reload</span>
                    </button>
                )}
            </div>

            {scanned === true && load === false && (
            <div className="device-table">

                    <div className="device-header">
                        <div>DEVICE</div>
                        <div>IP ADDRESS</div>
                        <div>MAC ADDRESS</div>
                        <div>STATUS</div>
                        <div>LATENCY</div>
                    </div>

                    {dev.map((device) => (
                        <div className="device-row" key={device.id}>

                            <div
                                className="device-name"
                                onClick={() => {
                                    if (rename_id !== device.id) {
                                        setbar(true)
                                        set_rename_id(device.id)
                                        set_string(device.name || device.hostname || "")
                                    }
                                }}
                            >
                                <div className="device-icon">
                                    🖥
                                </div>

                                <div>

                                    {rename_id !== device.id && (
                                        <strong>
                                            {device.name || device.hostname || "Unknown Device"}
                                        </strong>
                                    )}

                                    {rename_id === device.id && bar === true && (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            <input
                                                value={string}
                                                onChange={(e) => {
                                                    set_string(e.target.value)
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                            />

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()         
                                                    send_device(device.id, string)
                                                    setdev((prev) =>
                                                        prev.map((d) =>
                                                            d.id === device.id
                                                                ? { ...d, name: string }
                                                                : d
                                                        )
                                                    )
                                                    setbar(false)
                                                    set_rename_id(0)
                                                    
                                                }}
                                            >
                                                <span style={{ fontSize: "17px", color: "white" }}>
                                                    ✓
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    <small>
                                        {device.hostname || "No hostname"}
                                    </small>

                                </div>
                            </div>

                            <div className="device-ip">
                                {device.ip}
                            </div>

                            <div className="device-mac">
                                {device.mac}
                            </div>

                            <div className={`device-status ${device.status.toLowerCase()}`}>
                                <span className="status-dot"></span>
                                {device.status}
                            </div>

                            <div className="device-latency">
                                {device.response_time_ms !== null
                                    ? `${device.response_time_ms} ms`
                                    : "—"
                                }
                            </div>

                        </div>
                    ))}

                </div>
            )}
        </>
    )
}

export default NetworkScanner