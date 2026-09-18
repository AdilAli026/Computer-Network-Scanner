import { useEffect,useState } from "react"
import { LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip} from "recharts"

function MyPC({ws,setws,system,setsystem})
{   
    const [history,sethistory] = useState([])
    const [select,setselect] = useState("cpu")
    useEffect(() => {
        const get_sys = async () => {
            const response = await fetch("http://127.0.0.1:8000/api/system")
            const data = await response.json()
            setsystem(data)
        }
        get_sys();
    },[])

    useEffect(() => {
        const ws = new WebSocket("ws://127.0.0.1:8000/ws")

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)


            setws(data)
            sethistory(prev => [
                ...prev,
                {
                    time: new Date().toLocaleTimeString(),
                    cpu:data.cpu.usage_percent,
                    ram:data.memory.usage_percent,
                    download:data.data.download_mb,
                    upload:data.data.upload_mb,
                    latency:data.latency.ms
                }
            ].slice(-30))
        }

        ws.onerror = (error) => {
            console.log("WebSocket Error:", error)
        }

        return () => ws.close()
    }, [])
        return(
            <div>


                <div className="graph-container-pc">

                    <LineChart width={550} height={400} data={history}>

                        <XAxis dataKey="time" />

                        <YAxis
                            domain={[1,"auto"]}
                            label={{
                                value:
                                    select === "cpu" ? "CPU Usage (%)" :
                                    select === "ram" ? "RAM Usage (%)" :
                                    select === "download" ? "Download (MB/s)" :
                                    select === "upload" ? "Upload (MB/s)" :
                                    "Latency (ms)",
                                angle: -90,
                                position: "insideLeft",
                            }}
                        />

                        <Tooltip />


                    <Line
                        type="monotone"
                        dataKey={select}
                        stroke={
                            select === "cpu" ? "#06B6D4" :
                            select === "ram" ? "#22C55E" :
                            select === "download" ? "green" :
                            select === "upload" ? "red" :
                            "purple"
                        }
                    />


                    </LineChart>

                    <div className="graph-button-display">

                        <button className="graph-button" onClick={() => setselect("cpu")}>
                            CPU
                        </button>

                        <button className="graph-button" onClick={() => setselect("ram")}>
                            RAM
                        </button>
                        
                        <button className="graph-button" onClick={() => setselect("download")}>
                            DOWNLOAD
                        </button>

                        <button className="graph-button" onClick={() => setselect("upload")}>
                            UPLOAD
                        </button>

                        <button className="graph-button" onClick={() => setselect("latency")}>
                            LATENCY
                        </button>

                    </div>

                    <div className="display-card">
                        <p className="text-left text-gray-200 font-light">OS/PLATFORM : {system?.system.platform}</p>
                        <p className="text-left text-gray-200 font-light">VERSION : {system?.system.release}</p>
                        <p className="text-left text-gray-200 font-light">CPU : {system?.cpu.name}</p>
                        <p className="text-left text-gray-200 font-light">GPU : {system?.GPU.name}</p>
                    </div>
                </div>

                <div className="rec-layout">

                    <div className="box-layout">
                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            CPU USAGE
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {ws?.cpu.usage_percent}%
                            </span>
                        </p>
                    </div>
                    <div className="box-layout">

                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            RAM USAGE
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {ws?.memory.usage_percent}%
                            </span>
                        </p>

                    </div>
                    <div className="box-layout">

                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            DOWNLOAD SPEED
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {ws?.data.download_mb} MB/s
                            </span>
                        </p>

                    </div>
                    <div className="box-layout">
                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            CPU ARCHITECTURE
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {system?.system.architecture}
                            </span>
                        </p>
                    </div>

                </div>

                <div className="rec-layout">

                    <div className="box-layout">
                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            ROUTER LATENCY
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {ws?.latency.ms}
                            </span>
                        </p>
                    </div>

                    <div className="box-layout">

                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            RAM USAGE GB
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {ws?.memory.used_gb}/{system?.memory.total_gb}
                            </span>
                        </p>
                    </div>

                    <div className="box-layout">

                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            UPLOAD SPEED
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {ws?.data.upload_mb} MB/s
                            </span>
                        </p>

                    </div>
                    <div className="box-layout">
                        <p className="text-base font-light pt-5 pl-0" style={{ color: "var(--text)" }}>
                            CORES/THREADS
                            <span className="block mt-2 font-mono font-semibold text-3xl text-gray-200">
                                {system?.cpu.cores}/{system?.cpu.threads}
                            </span>
                        </p>
                    </div>
                </div>



            </div>
        )
}

export default MyPC