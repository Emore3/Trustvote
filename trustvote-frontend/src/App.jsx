import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import AdminDashboard from "./components/AdminDashboard";
import VoterDashboard from "./components/VoterDashboard";
import ElectionResults from "./components/ElectionResults";
import { Web3AuthProvider } from "./Web3AuthContext";
import "./App.css";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Web3AuthProvider>
      <Router>
        <Toaster position="top-right" />
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
          <Footer />
        </div>
      </Router>
    </Web3AuthProvider>
  );
}

export default App;
