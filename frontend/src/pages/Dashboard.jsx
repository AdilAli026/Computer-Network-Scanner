import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";
import {
    Router,
    Wifi,
    Download,
    Upload
} from "lucide-react";
function Dashboard({devices,wifi,setwifi,netstat,setnetstat,ws,setws,system,setsystem})
{
    const navigate = useNavigate();
    const [download,setdownload] = useState(0)
    const [upload,setupload] = useState(0)
    const [bandwidthHistory, setBandwidthHistory] = useState([]);
    useEffect(() => {
        const getWifi = async () => {
            const response = await fetch("http://127.0.0.1:8000/api/networkname")
            const data = await response.json()
            setwifi(data.Network)
        }
        const get_online = async() => {
            const response = await fetch("http://127.0.0.1:8000/api/internet")
            const data = await response.json()
            setnetstat(data.status)
        }
        getWifi()
        get_online()
    }, [])

    useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws")

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        setdownload(data.data.download_mb)
        setupload(data.data.upload_mb)
        setws(data)
        const downup = {
            time: new Date().toLocaleTimeString(),
            download: data.data.download_mb,
            upload: data.data.upload_mb
        }

        setBandwidthHistory(prev => [
            ...prev,
            downup
        ].slice(-30))
    }

    ws.onerror = (error) => {
        console.log("WebSocket error:", error)
    }

    return () => {
        ws.close()
    }
}, [])

    return(
        <div>
            <div className="container">
                <div className="info-box-head">

                    {/* First row */}
                    <div className="network-row">
                        <span style={{fontSize:"35px",fontWeight:"1000"}}>{wifi}</span>
                    </div>

                    {/* Second row */}
                    <div className="status-row">
                        <span style={{fontSize:"20px",fontWeight:"1000"}}>Network Status : {netstat}</span>
                    </div>

                    {netstat === "Online" && (
                        <div className="wifi-img">
                            <img src="online.png" />
                        </div>
                    )}

                    {netstat === "Offline" && (
                        <div className="wifi-img">
                            <img src="offline.png" />
                        </div>
                    )}


                    <div className="containerbutton">
                        <button onClick={() => navigate("/scan")} className="searchbutton">
                            <div className="button-press">
                                Go to Scanner page
                                <img src="search.png" alt ="search"></img>
                            </div>
                        </button>
                    </div>

                </div>








                
            </div>
                    


            <div className="containertwo">

                {/* Router Latency */}
                <div className="info-box">

                    <div className="metric-heading">
                        <Router size={18} />
                        <span>Router Latency</span>
                    </div>

                    <div className="latency-value">
                        {ws?.latency.ms ?? "--"}
                        <span>ms</span>
                    </div>

                    <div className="latency-bar">
                        <div className="latency-progress"></div>
                    </div>

                    <span className="metric-description">
                        Network response
                    </span>

                </div>


                {/* Devices */}
                <div className="info-box">

                    <div className="metric-heading">
                        <Wifi size={18} />
                        <span>Devices Online</span>
                    </div>

                    <div className="device-value">
                        {devices}
                    </div>

                    <span className="metric-description">
                        {devices === 0
                            ? "No devices found"
                            : devices === 1
                                ? "Device connected"
                                : "Devices connected"
                        }
                    </span>

                </div>


                {/* Download */}
                <div className="info-box">

                    <div className="metric-heading download-heading">
                        <Download size={18} />
                        <span>Download</span>
                    </div>

                    <div className="speed-arrow download-arrow">
                        <Download size={25} />
                    </div>

                    <div className="speed-value">
                        {download}
                    </div>

                    <span className="speed-unit">
                        MB/s
                    </span>

                </div>


                {/* Upload */}
                <div className="info-box">

                    <div className="metric-heading upload-heading">
                        <Upload size={18} />
                        <span>Upload</span>
                    </div>

                    <div className="speed-arrow upload-arrow">
                        <Upload size={25} />
                    </div>

                    <div className="speed-value">
                        {upload}
                    </div>

                    <span className="speed-unit">
                        MB/s
                    </span>

                </div>

            </div>


            <div className="graph-container">
                <span className="device-header">Live Graph of Download/Upload MB/s</span>

                <div className="graph">
                    <LineChart 
                        width={800} 
                        height={220} 
                        data={bandwidthHistory} 
                    >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="time" />

                        <YAxis 
                            domain={[0, 10]}
                            tickCount={6}
                            label={{
                                value: "MB/s",
                                angle: -90,
                                position: "insideLeft"
                            }}
                        />

                        <Tooltip />

                        <Line
                            type="natural"
                            dataKey="download"
                            stroke="green"
                            dot={false}
                        />

                        <Line
                            type="monotone"
                            dataKey="upload"
                            stroke="red"
                            dot={false}
                        />
                    </LineChart>
                </div>
            </div>

        </div>
    )
}
export default Dashboard