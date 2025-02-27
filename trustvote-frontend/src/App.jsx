import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import AdminDashboard from "./components/AdminDashboard";
import VoterDashboard from "./components/VoterDashboard";
import ElectionResults from "./components/ElectionResults";
import { Web3AuthProvider } from "./Web3AuthContext";

function App() {
  return (
    <Web3AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/voter" element={<VoterDashboard />} />
          <Route path="/results" element={<ElectionResults />} />
        </Routes>
      </Router>
    </Web3AuthProvider>
  );
}

export default App;
