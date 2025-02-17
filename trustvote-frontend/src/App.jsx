import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import VoterDashboard from './components/VoterDashboard';
import ElectionResults from './components/ElectionResults';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/voter" element={<VoterDashboard />} />
        <Route path="/results" element={<ElectionResults />} />
      </Routes>
    </Router>
  );
}

export default App;
