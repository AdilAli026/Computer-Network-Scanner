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

                        {netstat === "Online" && (
                            <img src="online.png" alt="Online" />
                        )}

                        {netstat === "Offline" && (
                            <img src="offline.png" alt="Offline" />
                        )}
                    </div>

                    {/* Second row */}
                    <div className="status-row">
                        <span style={{fontSize:"20px",fontWeight:"1000"}}>Network Status : {netstat}</span>
                    </div>

                </div>
            </div>
                    

            <div className="containerbutton">
                <button onClick={() => navigate("/scan")} className="searchbutton">
                    <div className="button-scan">
                                Go to Scanner page
                                <img src="search.png" alt ="search"></img>
                    </div>
                </button>
            </div>

            <div className="containertwo">
                <div className="info-box">
                    Router Latency : {ws?.latency.ms}
                </div>
                <div className="info-box">       
                    {devices === 0 && (
                        <div>
                            No Devices Found
                        </div>
                    )}
                    {devices != 0 && (
                        <div>
                            Devices Online : {devices}
                        </div>
                    )}
                </div>
            </div>

            <div className="containertwo">
                <div className="info-box">
                    <span>Download Speed : {download}</span>
                </div>
                <div className="info-box">
                    <span>Upload Speed : {upload}</span>
                </div>
            </div>

            <div className="graph-container">
                <LineChart
                    width={400}
                    height={200}
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
    )
}
export default Dashboard