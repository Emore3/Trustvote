"use client";

import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);

  // For elections list and selection
  const [electionsList, setElectionsList] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [selectedElectionDetails, setSelectedElectionDetails] = useState(null);

  // States for Admin management
  const [newAdmin, setNewAdmin] = useState("");
  const [adminsList, setAdminsList] = useState([]);

  // States for Voter management
  const [newVoter, setNewVoter] = useState("");
  const [votersList, setVotersList] = useState([]);

  // States for Election management (for creating new election)
  const [newElectionName, setNewElectionName] = useState("");
  const [newElectionStartTime, setNewElectionStartTime] = useState("");
  const [newElectionEndTime, setNewElectionEndTime] = useState("");

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
          setLoading(true);
          // Create BrowserProvider with chain id (e.g., Sepolia: 11155111)
          const ethersProvider = new BrowserProvider(provider, 11155111);
          ethersProvider.skipFetchAccounts = true;
          // Manually fetch accounts using "eth_accounts"
          const accounts = await ethersProvider.send("eth_accounts", []);
          if (accounts.length) {
            setAccount(accounts[0]);
            // Create read-only contract instance using ethersProvider
            const contractRead = new ethers.Contract(
              contractAddress,
              contractABI.abi,
              ethersProvider
            );
            // Check if connected account has ADMIN_ROLE
            const adminStatus = await contractRead.hasRole(
              ADMIN_ROLE,
              accounts[0]
            );
            setIsAdmin(adminStatus);
            // Retrieve private key via provider (as recommended by Web3Auth)
            const pk = await provider.request({ method: "eth_private_key" });
            // Create a Wallet signer using the private key and ethersProvider
            const walletSigner = new ethers.Wallet(pk, ethersProvider);
            // Create writeable contract instance by connecting the signer
            // const contractWithSigner = contractRead.connect(walletSigner)
            const contractWithSigner = new ethers.Contract(
              contractAddress,
              contractABI.abi,
              walletSigner
            );
            setVotingContract(contractWithSigner);
            setVotingContractRead(contractRead);

          }
        } catch (error) {
          console.error("Error initializing admin dashboard:", error);
          setStatusMessage("Error initializing dashboard");
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [provider]);

  useEffect(() => {
    // Only fetch elections when votingContractRead is set
    // and we know we have an admin (isAdmin) or at least an account
    if (votingContractRead && isAdmin) {
      handleViewElections();
      handleViewAdmins();
      handleViewVoters();
    }
  }, [votingContractRead, isAdmin]);

  // ----------------- Elections List Functions -----------------
  const handleViewElections = async () => {
    console.log("i ran 3")
    if (!votingContractRead) return;
    try {
      setLoading(true);
      const countBN = await votingContractRead.electionCount();
      const electionCount = Number(countBN.toString());
      const list = [];
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
    } finally {
      setLoading(false);
    }
  };

  const handleSelectElection = async (election) => {
    setSelectedElectionId(election.id);
    setSelectedElectionDetails(election);
    // Pre-fill update fields with current details (convert timestamps to datetime-local format)
    const startDate = new Date(election.startTime * 1000)
      .toISOString()
      .slice(0, 16);
    const endDate = new Date(election.endTime * 1000)
      .toISOString()
      .slice(0, 16);
    setUpdateElectionName(election.name);
    setUpdateElectionStartTime(startDate);
    setUpdateElectionEndTime(endDate);
  };

  // ----------------- Admin CRUD Functions -----------------
  const handleAddAdmin = async () => {
    if (!votingContract) return;
    try {
      setLoading(true);
      const tx = await votingContract.addAdmin(newAdmin);
      await tx.wait();
      setStatusMessage("Admin added successfully");
      setNewAdmin("");
      handleViewAdmins();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding admin");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAdmins = async () => {
    if (!votingContractRead) return;
    try {
      setLoading(true);
      const admins = await votingContractRead.viewAdmins();
      setAdminsList(admins);
      setStatusMessage("Admins fetched successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching admins");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Voter CRUD Functions -----------------
  const handleRegisterVoter = async () => {
    if (!votingContract) return;
    try {
      setLoading(true);
      const tx = await votingContract.registerVoter(newVoter);
      await tx.wait();
      setStatusMessage("Voter registered successfully");
      setNewVoter("");
      handleViewVoters();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error registering voter");
    } finally {
      setLoading(false);
    }
  };

  const handleViewVoters = async () => {
    if (!votingContractRead) return;
    try {
      setLoading(true);
      const voters = await votingContractRead.viewVoters();
      setVotersList(voters);
      setStatusMessage("Voters fetched successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching voters");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Election CRUD Functions -----------------
  const handleCreateElection = async () => {
    if (!votingContract) return;
    try {
      setLoading(true);
      // Convert datetime-local strings to Unix timestamps (in seconds)
      const start = Math.floor(new Date(newElectionStartTime).getTime() / 1000);
      const end = Math.floor(new Date(newElectionEndTime).getTime() / 1000);
      const tx = await votingContract.createElection(
        newElectionName,
        start,
        end
      );
      await tx.wait();
      setStatusMessage("Election created successfully");
      setNewElectionName("");
      setNewElectionStartTime("");
      setNewElectionEndTime("");
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error creating election");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateElection = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      setLoading(true);
      // Convert datetime-local strings to Unix timestamps (in seconds)
      const start = Math.floor(
        new Date(updateElectionStartTime).getTime() / 1000
      );
      const end = Math.floor(new Date(updateElectionEndTime).getTime() / 1000);
      const tx = await votingContract.updateElection(
        selectedElectionId,
        updateElectionName,
        start,
        end
      );
      await tx.wait();
      setStatusMessage("Election updated successfully");
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error updating election");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteElection = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      setLoading(true);
      const tx = await votingContract.deleteElection(selectedElectionId);
      await tx.wait();
      setStatusMessage("Election deleted successfully");
      setSelectedElectionId(null);
      setSelectedElectionDetails(null);
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error deleting election");
    } finally {
      setLoading(false);
    }
  };

  const handleEndElection = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      setLoading(true);
      const tx = await votingContract.endElection(selectedElectionId);
      await tx.wait();
      setStatusMessage("Election ended successfully");
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error ending election");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Office & Candidate CRUD Functions -----------------
  const handleAddOffice = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      setLoading(true);
      const tx = await votingContract.addOffice(selectedElectionId, officeName);
      await tx.wait();
      setStatusMessage("Office added successfully");
      setOfficeName("");
      // Refresh selected election details
      handleViewElections();
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding office");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      setLoading(true);
      const officeIdx = Number(officeIndex);
      const tx = await votingContract.addCandidate(
        selectedElectionId,
        officeIdx,
        candidateName
      );
      await tx.wait();
      setStatusMessage("Candidate added successfully");
      setCandidateName("");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding candidate");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Render Sections -----------------
  const renderDashboard = () => (
    <div className="fade-in">
      <h2>Admin Dashboard</h2>
      <p className="mb-4">
        Welcome,{" "}
        {account &&
          `${account.substring(0, 6)}...${account.substring(
            account.length - 4
          )}`}
        . You are {isAdmin ? "an admin" : "not an admin"}.
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{electionsList.length}</div>
          <div className="stat-label">Total Elections</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {
              electionsList.filter(
                (e) => e.active && Date.now() / 1000 <= e.endTime
              ).length
            }
          </div>
          <div className="stat-label">Active Elections</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{adminsList.length}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{votersList.length}</div>
          <div className="stat-label">Registered Voters</div>
        </div>
      </div>

      <div className="card">
        <h3>Elections</h3>
        <button onClick={handleViewElections} className="mb-4">
          Refresh Elections
        </button>

        {electionsList.length > 0 ? (
          <div className="election-grid">
            {electionsList.map((election) => (
              <div key={election.id} className="election-card">
                <div className="election-card-header">
                  <div className="election-card-title">{election.name}</div>
                  <span
                    className={`election-card-status ${
                      election.active && Date.now() / 1000 <= election.endTime
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {election.active && Date.now() / 1000 <= election.endTime
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
                <div className="election-card-body">
                  <div className="election-card-info">
                    <div className="election-card-info-item">
                      <span className="election-card-info-label">ID:</span>
                      <span className="election-card-info-value">
                        {election.id}
                      </span>
                    </div>
                    <div className="election-card-info-item">
                      <span className="election-card-info-label">Start:</span>
                      <span className="election-card-info-value">
                        {new Date(election.startTime * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="election-card-info-item">
                      <span className="election-card-info-label">End:</span>
                      <span className="election-card-info-value">
                        {new Date(election.endTime * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="election-card-info-item">
                      <span className="election-card-info-label">Offices:</span>
                      <span className="election-card-info-value">
                        {election.officeCount}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="election-card-footer">
                  <button onClick={() => handleSelectElection(election)}>
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No elections found.</p>
        )}
      </div>
    </div>
  );

  const renderAdminManagement = () => (
    <div className="fade-in">
      <h2>Admin Management</h2>

      <div className="card mb-4">
        <h3>Current Admins</h3>
        <button onClick={handleViewAdmins} className="mb-4">
          Refresh Admin List
        </button>

        {adminsList && adminsList.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Admin Address</th>
              </tr>
            </thead>
            <tbody>
              {adminsList.map((admin, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No admins found.</p>
        )}
      </div>

      <div className="card">
        <h3>Add New Admin</h3>
        <div className="form-group">
          <label className="form-label">Admin Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
          />
        </div>
        <button onClick={handleAddAdmin} disabled={!newAdmin}>
          Add Admin
        </button>
      </div>
    </div>
  );

  const renderVoterManagement = () => (
    <div className="fade-in">
      <h2>Voter Management</h2>

      <div className="card mb-4">
        <h3>Registered Voters</h3>
        <button onClick={handleViewVoters} className="mb-4">
          Refresh Voter List
        </button>

        {votersList && votersList.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Voter Address</th>
              </tr>
            </thead>
            <tbody>
              {votersList.map((voter, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{voter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No voters found.</p>
        )}
      </div>

      <div className="card">
        <h3>Register New Voter</h3>
        <div className="form-group">
          <label className="form-label">Voter Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={newVoter}
            onChange={(e) => setNewVoter(e.target.value)}
          />
        </div>
        <button onClick={handleRegisterVoter} disabled={!newVoter}>
          Register Voter
        </button>
      </div>
    </div>
  );

  const renderElectionManagement = () => (
    <div className="fade-in">
      <h2>Election Management</h2>

      <div className="card mb-4">
        <h3>Create New Election</h3>
        <div className="form-group">
          <label className="form-label">Election Name</label>
          <input
            type="text"
            placeholder="Election Name"
            value={newElectionName}
            onChange={(e) => setNewElectionName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-col">
            <label className="form-label">Start Time</label>
            <input
              type="datetime-local"
              value={newElectionStartTime}
              onChange={(e) => setNewElectionStartTime(e.target.value)}
            />
          </div>
          <div className="form-col">
            <label className="form-label">End Time</label>
            <input
              type="datetime-local"
              value={newElectionEndTime}
              onChange={(e) => setNewElectionEndTime(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={handleCreateElection}
          disabled={
            !newElectionName || !newElectionStartTime || !newElectionEndTime
          }
          className="mt-4"
        >
          Create Election
        </button>
      </div>

      {selectedElectionId ? (
        <div className="card">
          <h3>Update Election: {selectedElectionDetails?.name}</h3>
          <div className="form-group">
            <label className="form-label">Election Name</label>
            <input
              type="text"
              value={updateElectionName}
              onChange={(e) => setUpdateElectionName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                value={updateElectionStartTime}
                onChange={(e) => setUpdateElectionStartTime(e.target.value)}
              />
            </div>
            <div className="form-col">
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                value={updateElectionEndTime}
                onChange={(e) => setUpdateElectionEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleUpdateElection}>Update Election</button>
            <button onClick={handleEndElection} className="btn-secondary">
              End Election
            </button>
            <button
              onClick={handleDeleteElection}
              style={{ backgroundColor: "var(--danger)" }}
            >
              Delete Election
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <p>Please select an election from the Dashboard to update it.</p>
        </div>
      )}
    </div>
  );

  const renderOfficeCandidateManagement = () => (
    <div className="fade-in">
      <h2>Office & Candidate Management</h2>

      {selectedElectionId ? (
        <>
          <div className="card mb-4">
            <h3>Add Office to {selectedElectionDetails?.name}</h3>
            <div className="form-group">
              <label className="form-label">Office Name</label>
              <input
                type="text"
                placeholder="Office Name"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
              />
            </div>
            <button onClick={handleAddOffice} disabled={!officeName}>
              Add Office
            </button>
          </div>

          <div className="card">
            <h3>Add Candidate</h3>
            <div className="form-row">
              <div className="form-col">
                <label className="form-label">Office Index</label>
                <input
                  type="number"
                  placeholder="Office Index"
                  value={officeIndex}
                  onChange={(e) => setOfficeIndex(e.target.value)}
                />
              </div>
              <div className="form-col">
                <label className="form-label">Candidate Name</label>
                <input
                  type="text"
                  placeholder="Candidate Name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handleAddCandidate}
              disabled={officeIndex === "" || !candidateName}
              className="mt-4"
            >
              Add Candidate
            </button>
          </div>
        </>
      ) : (
        <div className="card">
          <p>Please select an election from the Dashboard first.</p>
        </div>
      )}
    </div>
  );

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return renderDashboard();
      case "admin":
        return renderAdminManagement();
      case "voter":
        return renderVoterManagement();
      case "election":
        return renderElectionManagement();
      case "officeCandidate":
        return renderOfficeCandidateManagement();
      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };

  if (!loggedIn) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p>Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Loading</h2>
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p>Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p>You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>Admin Panel</h3>
        <ul className="sidebar-nav">
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${
                currentSection === "dashboard" ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentSection("dashboard");
                handleViewElections();
                handleViewAdmins();
                handleViewVoters();
              }}
            >
              Dashboard
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${
                currentSection === "admin" ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentSection("admin");
                handleViewAdmins();
              }}
            >
              Admin Management
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${
                currentSection === "voter" ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentSection("voter");
                handleViewVoters();
              }}
            >
              Voter Management
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${
                currentSection === "election" ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentSection("election");
              }}
            >
              Elections
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${
                currentSection === "officeCandidate" ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentSection("officeCandidate");
              }}
            >
              Offices & Candidates
            </a>
          </li>
        </ul>
      </div>

      <div className="dashboard-content">
        {statusMessage && (
          <div className="card mb-4" style={{ padding: "0.75rem 1.5rem" }}>
            <p style={{ margin: 0 }}>{statusMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="card text-center">
            <div className="spinner" style={{ margin: "0 auto" }}></div>
            <p>Processing your request...</p>
          </div>
        ) : (
          renderSection()
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
