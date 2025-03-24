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

  // New states
  const [officesList, setOfficesList] = useState([]);
  const [selectedOfficeIndex, setSelectedOfficeIndex] = useState("");
  const [officeCandidates, setOfficeCandidates] = useState([]);

  const deploymentBlock = 7959527;

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

  // Add an effect to load candidates when the selected office changes
  useEffect(() => {
    if (selectedOfficeIndex !== "") {
      loadCandidatesForOffice(selectedOfficeIndex);
    }
  }, [selectedOfficeIndex]);

  // ----------------- Elections List Functions -----------------
  const handleViewElections = async () => {
    if (!votingContractRead) return;
    try {
      setLoading(true);
      // Query for all ElectionCreated events from the contract
      const electionEvents = await votingContractRead.queryFilter(
        "ElectionCreated",
        deploymentBlock,
        "latest"
      );
      console.log("Fetched election events:", electionEvents);

      // Build a list of elections by processing each ElectionCreated event
      const list = [];
      for (const event of electionEvents) {
        const { electionId, name, startTime, endTime } = event.args;
        const id = Number(electionId);

        // Query for OfficeAdded events specific to this election
        const officeAddedFilter = votingContractRead.filters.OfficeAdded(id);
        const officeEvents = await votingContractRead.queryFilter(
          officeAddedFilter,
          deploymentBlock,
          "latest"
        );

        // Derive the office count from the number of OfficeAdded events
        const officeCount = officeEvents.length;

        // Optionally, build an array of office details (e.g., officeIndex and officeName)
        const offices = officeEvents.map((ev) => ({
          officeIndex: Number(ev.args.officeIndex),
          officeName: ev.args.officeName,
        }));

        list.push({
          id,
          name,
          active: true, // Assuming elections are active when created
          startTime: Number(startTime),
          endTime: Number(endTime),
          officeCount,
          offices, // You can use this array to display office details in your UI
        });
      }

      // Update state with the list of elections (including office information)
      setElectionsList(list);
      setStatusMessage("Elections fetched successfully via events");
    } catch (error) {
      console.error("Error fetching elections from events:", error);
      setStatusMessage("Error fetching elections");
    } finally {
      setLoading(false);
    }
  };

  const loadOfficesForElection = async (electionId) => {
    if (!votingContractRead || !electionId) return;
    try {
      setLoading(true);
      // Create a filter for the OfficeAdded event for this election
      const filter = votingContractRead.filters.OfficeAdded(electionId);
      // Query past events
      const events = await votingContractRead.queryFilter(
        filter,
        deploymentBlock,
        "latest"
      );
      const offices = events
        .map((event) => ({
          index: Number(event.args.officeIndex),
          name: event.args.officeName,
        }))
        .sort((a, b) => a.index - b.index);
      setOfficesList(offices);

      // Reset selected office and candidates
      setSelectedOfficeIndex("");
      setOfficeCandidates([]);
    } catch (error) {
      console.error("Error loading offices:", error);
      setStatusMessage("Error loading offices");
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatesForOffice = async (officeIndex) => {
    if (!votingContractRead || !selectedElectionId || officeIndex === "")
      return;
    try {
      setLoading(true);

      // --- 1. Query CandidateAdded events for the selected election ---
      const candidateAddedFilter =
        votingContractRead.filters.CandidateAdded(selectedElectionId);
      const candidateAddedEvents = await votingContractRead.queryFilter(
        candidateAddedFilter,
        deploymentBlock,
        "latest"
      );

      // Manually filter the events to get candidates for the selected office
      const candidateEventsForOffice = candidateAddedEvents.filter(
        (event) => Number(event.args.officeIndex) === Number(officeIndex)
      );

      // Build a list of candidates using the CandidateAdded events.
      // Initialize voteCount to 0; will update based on VoteCast events.
      let candidatesList = candidateEventsForOffice.map((event) => ({
        candidateIndex: Number(event.args.candidateIndex),
        name: event.args.candidateName,
        voteCount: 0,
      }));

      // --- 2. Query VoteCast events for the selected election ---
      const voteCastFilter =
        votingContractRead.filters.VoteCast(selectedElectionId);
      const voteCastEvents = await votingContractRead.queryFilter(
        voteCastFilter,
        deploymentBlock,
        "latest"
      );

      // Filter vote events for the selected office
      const voteEventsForOffice = voteCastEvents.filter(
        (event) => Number(event.args.officeIndex) === Number(officeIndex)
      );

      // --- 3. Tally votes for each candidate ---
      voteEventsForOffice.forEach((event) => {
        const candidateIndex = Number(event.args.candidateIndex);
        const candidate = candidatesList.find(
          (c) => c.candidateIndex === candidateIndex
        );
        if (candidate) {
          candidate.voteCount += 1;
        }
      });

      // Optionally, sort the candidates (e.g., descending by voteCount)
      candidatesList.sort((a, b) => b.voteCount - a.voteCount);

      // Update your state with the reconstructed candidate list
      setOfficeCandidates(candidatesList);
    } catch (error) {
      console.error("Error loading candidates from events:", error);
      setStatusMessage("Error loading candidates");
    } finally {
      setLoading(false);
    }
  };

  // Modify the handleSelectElection function to also load offices
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

    // Load offices for this election
    await loadOfficesForElection(election.id);
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

  // const handleDeleteElection = async () => {
  //   if (!votingContract || !selectedElectionId) return;
  //   try {
  //     setLoading(true);
  //     const tx = await votingContract.deleteElection(selectedElectionId);
  //     await tx.wait();
  //     setStatusMessage("Election deleted successfully");
  //     setSelectedElectionId(null);
  //     setSelectedElectionDetails(null);
  //     handleViewElections();
  //   } catch (error) {
  //     console.error(error);
  //     setStatusMessage("Error deleting election");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
      setStatusMessage(`Office "${officeName}" added successfully`);
      setOfficeName("");
      // Refresh the offices list
      await loadOfficesForElection(selectedElectionId);
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding office: " + error.message.split(" (")[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (
      !votingContract ||
      !selectedElectionId ||
      selectedOfficeIndex === "" ||
      !candidateName
    )
      return;
    try {
      setLoading(true);
      const tx = await votingContract.addCandidate(
        selectedElectionId,
        selectedOfficeIndex,
        candidateName
      );
      await tx.wait();
      setStatusMessage(
        `Candidate "${candidateName}" added successfully to office index ${selectedOfficeIndex}`
      );
      setCandidateName("");
      // Refresh the candidates list
      loadCandidatesForOffice(selectedOfficeIndex);
    } catch (error) {
      console.error(error);
      setStatusMessage(
        "Error adding candidate: " + error.message.split(" (")[0]
      );
    } finally {
      setLoading(false);
    }
  };

  // Replace the renderOfficeCandidateManagement function with this improved version
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

          <div className="card mb-4">
            <h3>Manage Offices & Candidates</h3>

            {officesList.length > 0 ? (
              <div className="form-group">
                <label className="form-label">Select Office</label>
                <select
                  value={selectedOfficeIndex}
                  onChange={(e) => setSelectedOfficeIndex(e.target.value)}
                  className="mb-4"
                >
                  <option value="">-- Select an office --</option>
                  {officesList.map((office) => (
                    <option key={office.index} value={office.index}>
                      {office.name} (Index: {office.index})
                    </option>
                  ))}
                </select>

                {selectedOfficeIndex !== "" && (
                  <>
                    <h4 className="mt-4 mb-2">Add Candidate</h4>
                    <div className="form-group">
                      <label className="form-label">Candidate Name</label>
                      <input
                        type="text"
                        placeholder="Candidate Name"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => handleAddCandidate()}
                      disabled={!candidateName}
                      className="mb-4"
                    >
                      Add Candidate
                    </button>

                    <h4 className="mt-4 mb-2">Current Candidates</h4>
                    {officeCandidates.length > 0 ? (
                      <table>
                        <thead>
                          <tr>
                            <th>Index</th>
                            <th>Name</th>
                            <th>Votes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {officeCandidates.map((candidate) => (
                            <tr key={candidate.index}>
                              <td>{candidate.index}</td>
                              <td>{candidate.name}</td>
                              <td>{candidate.voteCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No candidates found for this office.</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p>No offices found for this election. Add an office first.</p>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <p>Please select an election from the Dashboard first.</p>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => {
    return (
      <div className="fade-in">
        <h2>Dashboard</h2>
        <p>Welcome to the admin dashboard!</p>
        {selectedElectionDetails && (
          <div className="card">
            <h3>Selected Election: {selectedElectionDetails.name}</h3>
            <p>
              Start Time:{" "}
              {new Date(
                selectedElectionDetails.startTime * 1000
              ).toLocaleString()}
            </p>
            <p>
              End Time:{" "}
              {new Date(
                selectedElectionDetails.endTime * 1000
              ).toLocaleString()}
            </p>
          </div>
        )}
        <div className="card">
          <h3>Elections List</h3>
          {electionsList.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Active</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {electionsList.map((election) => (
                  <tr key={election.id}>
                    <td>{election.id}</td>
                    <td>{election.name}</td>
                    <td>{election.active ? "Yes" : "No"}</td>
                    <td>
                      {new Date(election.startTime * 1000).toLocaleString()}
                    </td>
                    <td>
                      {new Date(election.endTime * 1000).toLocaleString()}
                    </td>
                    <td>
                      <button onClick={() => handleSelectElection(election)}>
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No elections found.</p>
          )}
        </div>
      </div>
    );
  };

  const renderAdminManagement = () => {
    return (
      <div className="fade-in">
        <h2>Admin Management</h2>
        <div className="card mb-4">
          <h3>Add New Admin</h3>
          <div className="form-group">
            <label className="form-label">Admin Address</label>
            <input
              type="text"
              placeholder="New Admin Address"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
            />
          </div>
          <button onClick={handleAddAdmin} disabled={!newAdmin}>
            Add Admin
          </button>
        </div>

        <div className="card">
          <h3>Admins List</h3>
          {adminsList.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {adminsList.map((admin, index) => (
                  <tr key={index}>
                    <td>{admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No admins found.</p>
          )}
        </div>
      </div>
    );
  };

  const renderVoterManagement = () => {
    return (
      <div className="fade-in">
        <h2>Voter Management</h2>
        <div className="card mb-4">
          <h3>Register New Voter</h3>
          <div className="form-group">
            <label className="form-label">Voter Address</label>
            <input
              type="text"
              placeholder="New Voter Address"
              value={newVoter}
              onChange={(e) => setNewVoter(e.target.value)}
            />
          </div>
          <button onClick={handleRegisterVoter} disabled={!newVoter}>
            Register Voter
          </button>
        </div>

        <div className="card">
          <h3>Voters List</h3>
          {votersList.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {votersList.map((voter, index) => (
                  <tr key={index}>
                    <td>{voter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No voters found.</p>
          )}
        </div>
      </div>
    );
  };

  const renderElectionManagement = () => {
    return (
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
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="datetime-local"
              value={newElectionStartTime}
              onChange={(e) => setNewElectionStartTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <input
              type="datetime-local"
              value={newElectionEndTime}
              onChange={(e) => setNewElectionEndTime(e.target.value)}
            />
          </div>
          <button
            onClick={handleCreateElection}
            disabled={
              !newElectionName || !newElectionStartTime || !newElectionEndTime
            }
          >
            Create Election
          </button>
        </div>

        {selectedElectionId && (
          <div className="card mb-4">
            <h3>Update Election</h3>
            <div className="form-group">
              <label className="form-label">Election Name</label>
              <input
                type="text"
                placeholder="Election Name"
                value={updateElectionName}
                onChange={(e) => setUpdateElectionName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                value={updateElectionStartTime}
                onChange={(e) => setUpdateElectionStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                value={updateElectionEndTime}
                onChange={(e) => setUpdateElectionEndTime(e.target.value)}
              />
            </div>
            <button
              onClick={handleUpdateElection}
              disabled={
                !updateElectionName ||
                !updateElectionStartTime ||
                !updateElectionEndTime
              }
            >
              Update Election
            </button>
            <button onClick={handleEndElection}>End Election</button>
          </div>
        )}
      </div>
    );
  };

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
