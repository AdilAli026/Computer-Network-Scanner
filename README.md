# Computer & Network Monitor

A Windows-focused computer and network monitoring application, initially designed as a web application. It allows you to monitor your PC's system usage, including CPU, RAM, network speed, and router latency, while also keeping track of devices connected to your local Wi-Fi network.

The application scans the local network, pings discovered devices, and attempts to identify them using information such as IP addresses, MAC addresses, and hostnames.

## Project Evolution

This project started as a simple page that displayed the IP addresses of active devices on the local network.

It gradually evolved into a more complete monitoring application with features for both network and PC monitoring.

## Features

* CPU and RAM monitoring
* Download and upload speed monitoring
* Router latency monitoring
* Local network device scanning
* Device IP and MAC address detection
* Hostname detection
* Device online/offline status
* Device latency monitoring
* Real-time updates using WebSockets
* Device naming
* Dark mode

## Technologies Used

### Frontend

* React
* Vite
* Tailwind CSS
* Recharts
* React Router
* Lucide React

### Backend

* Python
* FastAPI
* SQLite
* psutil
* WebSockets

## Project Structure

```text
Computer & Network Monitor/
├── frontend/
│   ├── public/
│   ├── src/
│   └── other files
│
└── backend/
    └── main.py
```
