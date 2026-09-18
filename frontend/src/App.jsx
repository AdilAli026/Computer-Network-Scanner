import { useState,useEffect } from 'react'
import { LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip} from "recharts"
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import NetworkScanner from './pages/NetworkScanner'
import MyPC from './pages/MyPC'
import Welcome from './pages/Welcome'

import { Sun, Moon } from "lucide-react";
import './App.css'




function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [devices,setdevices] = useState(0)
  const [wifi,setwifi] = useState("Unknown")
  const [netstat,setnetstat] = useState("Offline")
  const [scanned,setscanned] = useState(false)
  const [dev, setdev] = useState([])
  const [ws,setws] = useState(null)
  const [system,setsystem] = useState(null)
  return (
    <div className={darkMode ? "app dark" : "app"}>
    <button
        className="mode-button"
        onClick={() => setDarkMode(!darkMode)}
    >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
    <nav className="navbar">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => isActive ? "nav-button active" : "nav-button"}
      >
        Dashboard
      </NavLink>

      <NavLink
        to="/scan"
        className={({ isActive }) => isActive ? "nav-button active" : "nav-button"}
      >
        Network Scanner
      </NavLink>

      <NavLink
        to="/pc"
        className={({ isActive }) => isActive ? "nav-button active" : "nav-button"}
      >
        My PC
      </NavLink>
    </nav>


      <Routes>

        <Route
        path="/"
        element={
            localStorage.getItem("hasVisited")
                ? <Navigate to="/dashboard" replace />
                : <Welcome />
        }/>


        <Route
          path="/dashboard"
          element={
            <Dashboard
              devices={devices}
              wifi={wifi}
              setwifi={setwifi}
              netstat={netstat}
              setnetstat={setnetstat}
              ws = {ws}
              setws = {setws}
              system = {system}
              setsystem = {setsystem}
            />
          }
        />
        <Route path="/scan" element={<NetworkScanner 
                                        devices={devices} 
                                        setdevices={setdevices} 
                                        scanned={scanned} 
                                        setscanned={setscanned}
                                        dev={dev}
                                        setdev={setdev}
                                        />
                                        } />
        <Route path="/pc" element={<MyPC 
                                      ws = {ws}
                                      setws = {setws}
                                      system = {system}
                                      setsystem = {setsystem}/>} />
      </Routes>

    </div>
  )
}

export default App
