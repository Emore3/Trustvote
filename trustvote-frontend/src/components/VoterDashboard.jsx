"use client";

import { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import contractABI from "../abis/VotingSystem.json";
import { useWeb3Auth } from "../Web3AuthContext";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const VOTER_ROLE = keccak256(toUtf8Bytes("VOTER_ROLE"));

function VoterDashboard() {
  const { provider, loggedIn } = useWeb3Auth();
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null); // writeable instance
  const [votingContractRead, setVotingContractRead] = useState(null); // read-only instance
  const [statusMessage, setStatusMessage] = useState("");
  const [isVoter, setIsVoter] = useState(false);
  const [currentSection, setCurrentSection] = useState("elections");
  const [loading, setLoading] = useState(false);

  // Elections and selection
  const [electionsList, setElectionsList] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [selectedElectionDetails, setSelectedElectionDetails] = useState(null);
  const [officesList, setOfficesList] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [candidatesList, setCandidatesList] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // New state for step-by-step voting
  const [currentOfficeIndex, setCurrentOfficeIndex] = useState(0);
  const [votedOffices, setVotedOffices] = useState({});
  const [votingComplete, setVotingComplete] = useState(false);
  const deploymentBlock = 7959527;

  // ----------------- Initialization -----------------
  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          setLoading(true);
          // Create a BrowserProvider using the Web3Auth provider and chain id (e.g., Sepolia: 11155111)
          const ethersProvider = new BrowserProvider(provider, 11155111);
          ethersProvider.skipFetchAccounts = true;
          // Manually fetch accounts
          const accounts = await ethersProvider.send("eth_accounts", []);
          console.log(accounts);
          if (accounts.length) {
            setAccount(accounts[0]);
            // Create a read-only contract instance
            const contractRead = new ethers.Contract(
              contractAddress,
              contractABI.abi,
              ethersProvider
            );
            // Check if the account has the VOTER_ROLE
            const voterStatus = await contractRead.hasRole(
              VOTER_ROLE,
              accounts[0]
            );
            setIsVoter(voterStatus);
            // Retrieve private key using the provider's request method (per Web3Auth instructions)
            const pk = await provider.request({ method: "eth_private_key" });
            // Create a wallet signer from the private key
            const walletSigner = new ethers.Wallet(pk, ethersProvider);
            // Create a writeable contract instance by connecting the signer
            const contractWithSigner = contractRead.connect(walletSigner);
            setVotingContract(contractWithSigner);
            setVotingContractRead(contractRead);

            // Load initial data automatically
            // await handleViewElections()
          }
        } catch (error) {
          console.error("Error initializing voter dashboard:", error);
          setStatusMessage("Error initializing dashboard");
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [provider]);

  useEffect(() => {
    // Only try to fetch if the read contract is set and we’re recognized as a voter
    if (votingContractRead && isVoter) {
      handleViewElections();
    }
  }, [votingContractRead, isVoter]);

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

  const handleSelectElection = async (election) => {
    setSelectedElectionId(election.id);
    setSelectedElectionDetails(election);
    setStatusMessage(`Election ${election.id} selected`);

    // Reset voting state
    setCurrentOfficeIndex(0);
    setVotedOffices({});
    setVotingComplete(false);
    setSelectedOffice(null);
    setSelectedCandidate(null);

    // Load offices for this election
    try {
      setLoading(true);
      // Create a filter for the OfficeAdded event for this election
      const filter = votingContractRead.filters.OfficeAdded(election.id);
      // Query past events (you can also set fromBlock if needed)
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

      // Automatically switch to vote section
      setCurrentSection("vote");

      // If there are offices, select the first one
      if (offices.length > 0) {
        await loadCandidatesForOffice(offices[0]);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Error loading offices");
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatesForOffice = async (office) => {
    setSelectedOffice(office);

    // Load candidates for this office
    try {
      setLoading(true);
      const candidates = await votingContractRead.getCandidates(
        selectedElectionId,
        office.index
      );
      const candidatesList = candidates.map((candidate, index) => ({
        index,
        name: candidate.name,
        voteCount: Number(candidate.voteCount),
      }));
      setCandidatesList(candidatesList);

      // If this office has been voted for, pre-select the candidate
      if (votedOffices[office.index] !== undefined) {
        setSelectedCandidate(votedOffices[office.index]);
      } else {
        setSelectedCandidate(null);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Error loading candidates");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Vote Casting Function -----------------
  const handleCastVote = async () => {
    if (
      !votingContract ||
      !selectedElectionId ||
      !selectedOffice ||
      selectedCandidate === null
    )
      return;
    try {
      setLoading(true);
      const tx = await votingContract.vote(
        selectedElectionId,
        selectedOffice.index,
        selectedCandidate
      );
      await tx.wait();

      // Update voted offices
      setVotedOffices((prev) => ({
        ...prev,
        [selectedOffice.index]: selectedCandidate,
      }));

      setStatusMessage(`Vote cast successfully for ${selectedOffice.name}!`);

      // Move to next office if available
      if (currentOfficeIndex < officesList.length - 1) {
        const nextIndex = currentOfficeIndex + 1;
        setCurrentOfficeIndex(nextIndex);
        await loadCandidatesForOffice(officesList[nextIndex]);
      } else {
        setVotingComplete(true);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Error casting vote: " + error.message.split(" (")[0]);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions for step-by-step voting
  const goToNextOffice = async () => {
    if (currentOfficeIndex < officesList.length - 1) {
      const nextIndex = currentOfficeIndex + 1;
      setCurrentOfficeIndex(nextIndex);
      await loadCandidatesForOffice(officesList[nextIndex]);
    } else {
      setVotingComplete(true);
    }
  };

  const goToPreviousOffice = async () => {
    if (currentOfficeIndex > 0) {
      const prevIndex = currentOfficeIndex - 1;
      setCurrentOfficeIndex(prevIndex);
      await loadCandidatesForOffice(officesList[prevIndex]);
    }
  };

  const goToOffice = async (index) => {
    if (index >= 0 && index < officesList.length) {
      setCurrentOfficeIndex(index);
      await loadCandidatesForOffice(officesList[index]);
    }
  };

  // ----------------- Render Sections -----------------
  const renderElections = () => (
    <div className="fade-in">
      <h2>Available Elections</h2>
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
                <button
                  onClick={() => handleSelectElection(election)}
                  disabled={
                    !election.active || Date.now() / 1000 > election.endTime
                  }
                >
                  {election.active && Date.now() / 1000 <= election.endTime
                    ? "Select"
                    : "Ended"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>No elections found.</p>
        </div>
      )}
    </div>
  );

  const renderVote = () => (
    <div className="fade-in">
      <h2>Cast Your Vote</h2>

      {selectedElectionId ? (
        <div className="card">
          <h3>{selectedElectionDetails?.name}</h3>
          <p>
            Election ends:{" "}
            {new Date(selectedElectionDetails?.endTime * 1000).toLocaleString()}
          </p>

          {officesList.length > 0 ? (
            <div className="voting-interface">
              {/* Progress indicator */}
              <div className="voting-progress">
                {officesList.map((office, index) => (
                  <button
                    key={office.index}
                    className={`progress-step ${
                      index === currentOfficeIndex ? "active" : ""
                    } ${
                      votedOffices[office.index] !== undefined ? "voted" : ""
                    }`}
                    onClick={() => goToOffice(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Current office voting */}
              <div className="voting-step">
                <h4 className="office-title">
                  {officesList[currentOfficeIndex]?.name}
                  <span className="office-counter">
                    ({currentOfficeIndex + 1}/{officesList.length})
                  </span>
                </h4>

                {votingComplete ? (
                  <div className="voting-complete">
                    <div className="voting-complete-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <h3>Voting Complete!</h3>
                    <p>Thank you for casting your votes in this election.</p>
                    <button
                      className="btn-primary"
                      onClick={() => setCurrentSection("elections")}
                    >
                      Return to Elections
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="candidates-list">
                      {candidatesList.length > 0 ? (
                        candidatesList.map((candidate) => (
                          <div
                            key={candidate.index}
                            className={`candidate-option ${
                              selectedCandidate === candidate.index
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedCandidate(candidate.index)
                            }
                          >
                            <div className="candidate-option-header">
                              <span className="candidate-option-name">
                                {candidate.name}
                              </span>
                              {selectedCandidate === candidate.index && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No candidates found for this office.</p>
                      )}
                    </div>

                    <div className="voting-navigation">
                      <button
                        onClick={goToPreviousOffice}
                        disabled={currentOfficeIndex === 0}
                        className="btn-secondary"
                      >
                        Previous
                      </button>

                      <div className="voting-actions">
                        {votedOffices[
                          officesList[currentOfficeIndex]?.index
                        ] !== undefined ? (
                          <button
                            onClick={goToNextOffice}
                            className="btn-primary"
                          >
                            {currentOfficeIndex === officesList.length - 1
                              ? "Finish"
                              : "Next"}
                          </button>
                        ) : (
                          <button
                            onClick={handleCastVote}
                            disabled={selectedCandidate === null}
                            className="btn-primary"
                          >
                            Cast Vote
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p>No offices available for this election.</p>
          )}
        </div>
      ) : (
        <div className="card">
          <p>Please select an active election first.</p>
        </div>
      )}
    </div>
  );

  if (loading && !account) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p>Please log in to access the voter dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isVoter) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p>
            You are not a registered voter. Please contact an administrator to
            register.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>Voter Dashboard</h3>
        <ul className="sidebar-nav">
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${
                currentSection === "elections" ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentSection("elections");
                handleViewElections();
              }}
            >
              Available Elections
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${
                currentSection === "vote" ? "active" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentSection("vote");
              }}
            >
              Cast Vote
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
        ) : currentSection === "elections" ? (
          renderElections()
        ) : (
          renderVote()
        )}
      </div>
    </div>
  );
}

export default VoterDashboard;
