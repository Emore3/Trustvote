import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import contractABI from "../abis/VotingSystem.json";
import { useWeb3Auth } from "../Web3AuthContext";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

function AdminDashboard() {
  // Common states
  const { provider, loggedIn } = useWeb3Auth();
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null); // Writeable instance
  const [votingContractRead, setVotingContractRead] = useState(null); // Read-only instance
  const [statusMessage, setStatusMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSection, setCurrentSection] = useState("dashboard");

  // For elections list and selection
  const [electionsList, setElectionsList] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [selectedElectionDetails, setSelectedElectionDetails] = useState(null);

  // States for Admin management
  const [newAdmin, setNewAdmin] = useState("");

  // States for Voter management
  const [newVoter, setNewVoter] = useState("");

  // States for Election management (for updating selected election)
  const [updateElectionName, setUpdateElectionName] = useState("");
  const [updateElectionStartTime, setUpdateElectionStartTime] = useState("");
  const [updateElectionEndTime, setUpdateElectionEndTime] = useState("");

  // States for Office & Candidate management (using selected election)
  const [officeName, setOfficeName] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [officeIndex, setOfficeIndex] = useState(""); // if needed for candidate operations

  // ----------------- Initialization -----------------
  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          // Create BrowserProvider with chain id (e.g., Sepolia: 11155111)
          const ethersProvider = new BrowserProvider(provider, 11155111);
          ethersProvider.skipFetchAccounts = true;
          // Manually fetch accounts using "eth_accounts"
          const accounts = await ethersProvider.send("eth_accounts", []);
          if (accounts.length) {
            setAccount(accounts[0]);
            // Create read-only contract instance using ethersProvider
            const contractRead = new ethers.Contract(contractAddress, contractABI.abi, ethersProvider);
            // Check if connected account has ADMIN_ROLE
            const adminStatus = await contractRead.hasRole(ADMIN_ROLE, accounts[0]);
            setIsAdmin(adminStatus);
            // Retrieve private key via provider (as recommended by Web3Auth)
            const pk = await provider.request({ method: "eth_private_key" });
            console.log("Private key:", pk);
            // Create a Wallet signer using the private key and ethersProvider
            const walletSigner = new ethers.Wallet(pk, ethersProvider);
            // Create writeable contract instance by connecting the signer
            const contractWithSigner = contractRead.connect(walletSigner);
            setVotingContract(contractWithSigner);
            setVotingContractRead(contractRead);
          }
        } catch (error) {
          console.error("Error initializing admin dashboard:", error);
          setStatusMessage("Error initializing dashboard");
        }
      }
    };
    init();
  }, [provider]);

  // ----------------- Elections List Functions -----------------
  const handleViewElections = async () => {
    if (!votingContractRead) return;
    try {
      const countBN = await votingContractRead.electionCount();
      const electionCount = Number(countBN.toString());
      let list = [];
      for (let i = 1; i <= electionCount; i++) {
        const details = await votingContractRead.getElectionDetails(i);
        // details: [name, active, startTime, endTime, officeCount]
        list.push({
          id: i,
          name: details[0],
          active: details[1],
          startTime: Number(details[2]),
          endTime: Number(details[3]),
          officeCount: Number(details[4]),
        });
      }
      setElectionsList(list);
      setStatusMessage("Elections fetched successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching elections");
    }
  };

  const handleSelectElection = async (election) => {
    setSelectedElectionId(election.id);
    setSelectedElectionDetails(election);
    // Pre-fill update fields with current details (convert timestamps to datetime-local format)
    const startDate = new Date(election.startTime * 1000).toISOString().slice(0,16);
    const endDate = new Date(election.endTime * 1000).toISOString().slice(0,16);
    setUpdateElectionName(election.name);
    setUpdateElectionStartTime(startDate);
    setUpdateElectionEndTime(endDate);
  };

  // ----------------- Admin CRUD Functions -----------------
  const handleAddAdmin = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.addAdmin(newAdmin);
      await tx.wait();
      setStatusMessage("Admin added successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding admin");
    }
  };

  const handleViewAdmins = async () => {
    if (!votingContractRead) return;
    try {
      const Admins = await votingContractRead.viewAdmins();
      setAdminsList(Admins);
      setStatusMessage("Admins fetched successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching Admins");
    }
  };

  // ----------------- Voter CRUD Functions -----------------
  const handleRegisterVoter = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.registerVoter(newVoter);
      await tx.wait();
      setStatusMessage("Voter registered successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error registering voter");
    }
  };

  const handleViewVoters = async () => {
    if (!votingContractRead) return;
    try {
      const voters = await votingContractRead.viewVoters();
      setVotersList(voters);
      setStatusMessage("Voters fetched successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching voters");
    }
  };

  // ----------------- Election CRUD Functions -----------------
  const handleUpdateElection = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      // Convert datetime-local strings to Unix timestamps (in seconds)
      const start = Math.floor(new Date(updateElectionStartTime).getTime() / 1000);
      const end = Math.floor(new Date(updateElectionEndTime).getTime() / 1000);
      const tx = await votingContract.updateElection(selectedElectionId, updateElectionName, start, end);
      await tx.wait();
      setStatusMessage("Election updated successfully");
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error updating election");
    }
  };

  const handleDeleteElection = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      const tx = await votingContract.deleteElection(selectedElectionId);
      await tx.wait();
      setStatusMessage("Election deleted successfully");
      setSelectedElectionId(null);
      setSelectedElectionDetails(null);
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error deleting election");
    }
  };

  const handleEndElection = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      const tx = await votingContract.endElection(selectedElectionId);
      await tx.wait();
      setStatusMessage("Election ended successfully");
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error ending election");
    }
  };

  // ----------------- Office & Candidate CRUD Functions -----------------
  const handleAddOffice = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      const tx = await votingContract.addOffice(selectedElectionId, officeName);
      await tx.wait();
      setStatusMessage("Office added successfully");
      // Optionally refresh selected election details if needed.
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding office");
    }
  };

  const handleAddCandidate = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      const officeIdx = Number(officeIndex);
      const tx = await votingContract.addCandidate(selectedElectionId, officeIdx, candidateName);
      await tx.wait();
      setStatusMessage("Candidate added successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding candidate");
    }
  };

  // ----------------- Sidebar Component -----------------
  const Sidebar = () => (
    <div style={{ width: "250px", background: "#f4f4f4", padding: "20px", height: "100vh" }}>
      <h3 style={{ color: "black"}}>Dashboard</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li
          style={{ marginBottom: "10px", cursor: "pointer", color: currentSection === "dashboard" ? "blue" : "black" }}
          onClick={() => setCurrentSection("dashboard")}
        >
          Overview
        </li>
        <li
          style={{ marginBottom: "10px", cursor: "pointer", color: currentSection === "admin" ? "blue" : "black" }}
          onClick={() => setCurrentSection("admin")}
        >
          Admin Management
        </li>
        <li
          style={{ marginBottom: "10px", cursor: "pointer", color: currentSection === "voter" ? "blue" : "black" }}
          onClick={() => setCurrentSection("voter")}
        >
          Voter Management
        </li>
        <li
          style={{ marginBottom: "10px", cursor: "pointer", color: currentSection === "election" ? "blue" : "black" }}
          onClick={() => setCurrentSection("election")}
        >
          Elections
        </li>
        <li
          style={{ marginBottom: "10px", cursor: "pointer", color: currentSection === "officeCandidate" ? "blue" : "black" }}
          onClick={() => setCurrentSection("officeCandidate")}
        >
          Office & Candidate
        </li>
      </ul>
    </div>
  );

  // ----------------- Render Sections -----------------
  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return (
          <div>
            <h2>Overview</h2>
            <p>Welcome, {account}. You are {isAdmin ? "an admin" : "not an admin"}.</p>
            <button onClick={handleViewElections}>Refresh Elections List</button>
            {electionsList.length > 0 ? (
              <table border="1" cellPadding="8" style={{ marginTop: "10px" }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Active</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Offices</th>
                    <th>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {electionsList.map((election) => (
                    <tr key={election.id}>
                      <td>{election.id}</td>
                      <td>{election.name}</td>
                      <td>{election.active ? "Yes" : "No"}</td>
                      <td>{new Date(election.startTime * 1000).toLocaleString()}</td>
                      <td>{new Date(election.endTime * 1000).toLocaleString()}</td>
                      <td>{election.officeCount}</td>
                      <td>
                        <button onClick={() => handleSelectElection(election)}>Select</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No elections found.</p>
            )}
          </div>
        );
      case "admin":
        return (
          <div>
            <h2>Admin Management</h2>
            <button onClick={handleViewAdmins}>Refresh Admin List</button>
            {/** Here you can also render a list of admins if needed */}
            <h3>Add New Admin</h3>
            <input type="text" placeholder="New admin address" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
            <button onClick={handleAddAdmin}>Add Admin</button>
          </div>
        );
      case "voter":
        return (
          <div>
            <h2>Voter Management</h2>
            <button onClick={handleViewVoters}>Refresh Voter List</button>
            {/** Render voters list if desired */}
            <h3>Register New Voter</h3>
            <input type="text" placeholder="Voter address" value={newVoter} onChange={(e) => setNewVoter(e.target.value)} />
            <button onClick={handleRegisterVoter}>Register Voter</button>
          </div>
        );
      case "election":
        return (
          <div>
            <h2>Manage Election</h2>
            {selectedElectionId ? (
              <div>
                <p>
                  Selected Election ID: <strong>{selectedElectionId}</strong> (Name:{" "}
                  <strong>{selectedElectionDetails?.name}</strong>)
                </p>
                <h3>Update Election</h3>
                <label>
                  Name:{" "}
                  <input type="text" value={updateElectionName} onChange={(e) => setUpdateElectionName(e.target.value)} />
                </label>
                <br />
                <label>
                  Start Time:{" "}
                  <input type="datetime-local" value={updateElectionStartTime} onChange={(e) => setUpdateElectionStartTime(e.target.value)} />
                </label>
                <br />
                <label>
                  End Time:{" "}
                  <input type="datetime-local" value={updateElectionEndTime} onChange={(e) => setUpdateElectionEndTime(e.target.value)} />
                </label>
                <br />
                <button onClick={handleUpdateElection}>Update Election</button>
                <button onClick={handleEndElection} style={{ marginLeft: "10px" }}>End Election</button>
                <button onClick={handleDeleteElection} style={{ marginLeft: "10px" }}>Delete Election</button>
              </div>
            ) : (
              <p>Please select an election from the Overview tab.</p>
            )}
          </div>
        );
      case "officeCandidate":
        return (
          <div>
            <h2>Office & Candidate Management</h2>
            {selectedElectionId ? (
              <div>
                <p>
                  Managing election ID: <strong>{selectedElectionId}</strong> (Name:{" "}
                  <strong>{selectedElectionDetails?.name}</strong>)
                </p>
                <div>
                  <h3>Add Office</h3>
                  <input type="text" placeholder="Office Name" value={officeName} onChange={(e) => setOfficeName(e.target.value)} />
                  <button onClick={handleAddOffice}>Add Office</button>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <h3>Add Candidate</h3>
                  <input type="text" placeholder="Office Index" value={officeIndex} onChange={(e) => setOfficeIndex(e.target.value)} />
                  <input type="text" placeholder="Candidate Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
                  <button onClick={handleAddCandidate}>Add Candidate</button>
                </div>
              </div>
            ) : (
              <p>Please select an election from the Overview tab.</p>
            )}
          </div>
        );
      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };

  if (!loggedIn) {
    return <div style={{ padding: "20px" }}>Please log in to access the admin dashboard.</div>;
  }
  if (!account) {
    return <div style={{ padding: "20px" }}>Loading account information...</div>;
  }
  if (!isAdmin) {
    return <div style={{ padding: "20px" }}>Access denied. You are not an admin.</div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        {statusMessage && <p style={{ color: "green" }}>{statusMessage}</p>}
        {renderSection()}
      </div>
    </div>
  );
}

export default AdminDashboard;
