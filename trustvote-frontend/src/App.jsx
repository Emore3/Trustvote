import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./components/Home"
import AdminDashboard from "./components/AdminDashboard"
import VoterDashboard from "./components/VoterDashboard"
import ElectionResults from "./components/ElectionResults"
import { Web3AuthProvider } from "./Web3AuthContext"
import "./App.css"

function App() {
  return (
    <Web3AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/voter" element={<VoterDashboard />} />
              <Route path="/results" element={<ElectionResults />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Web3AuthProvider>
  )
}

export default App

