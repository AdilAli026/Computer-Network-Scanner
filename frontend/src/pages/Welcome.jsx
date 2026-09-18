import { useNavigate } from "react-router-dom";
import { Monitor, Wifi, Router, Activity } from "lucide-react";

function Welcome() {
    const navigate = useNavigate();
    function getStarted() {
        localStorage.setItem("hasVisited", "true");
        navigate("/dashboard");
    }

    return (
        <div className="welcome-page">

            <div className="welcome-content">

                <div className="welcome-icon">
                    <Monitor size={42} />
                </div>

                <h1>
                    Computer & Network
                    <span> Monitor</span>
                </h1>

                <p className="welcome-subtitle">
                    Monitor your computer and network from one simple dashboard.
                </p>

                <div className="welcome-features">

                    <div className="welcome-feature">
                        <Wifi size={21} />
                        <span>Network Status</span>
                    </div>

                    <div className="welcome-feature">
                        <Router size={21} />
                        <span>Connected Devices</span>
                    </div>

                    <div className="welcome-feature">
                        <Activity size={21} />
                        <span>Internet & Performance</span>
                    </div>

                </div>

                <button
                    className="welcome-button"
                    onClick={getStarted}
                >
                    Get Started
                </button>

            </div>
            <div className="build-tag">
                <span>Build v1.00</span>
            </div>
        </div>
    );
}

export default Welcome;