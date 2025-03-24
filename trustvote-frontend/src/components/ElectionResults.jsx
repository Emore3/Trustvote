"use client";

import toast from "react-hot-toast";

import { useState, useEffect, useRef } from "react";
import { ethers, BrowserProvider } from "ethers";
import contractABI from "../abis/VotingSystem.json";
import { useWeb3Auth } from "../Web3AuthContext";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

function ElectionResults() {
  const { provider, loggedIn } = useWeb3Auth();
  const [account, setAccount] = useState(null);
  const [votingContractRead, setVotingContractRead] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [electionsList, setElectionsList] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [selectedElectionDetails, setSelectedElectionDetails] = useState(null);
  const [officeResults, setOfficeResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ref for results container to scroll to
  const resultsRef = useRef(null);
  const deploymentBlock = 7959527;

  // ----------------- Initialization -----------------
  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          setLoading(true);
          const ethersProvider = new BrowserProvider(provider, 11155111);
          ethersProvider.skipFetchAccounts = true;
          const accounts = await ethersProvider.send("eth_accounts", []);
          if (accounts.length) {
            setAccount(accounts[0]);
            const contractRead = new ethers.Contract(
              contractAddress,
              contractABI.abi,
              ethersProvider
            );
            setVotingContractRead(contractRead);

            // // Load initial data
            // handleViewElections()
          }
        } catch (error) {
          console.error("Error initializing election results page:", error);
          setStatusMessage("Error initializing page");
          {handleError("Error initializing page")}
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [provider]);

  useEffect(() => {
    if (votingContractRead) {
      handleViewElections();
    }
  }, [votingContractRead]);

  const handleSuccess = (message) => {
    toast.success(message);
  };

  const handleError = (message) => {
    toast.error(message);
  };

  // Set up an event listener for real-time updates
  // useEffect(() => {
  //   if (!votingContractRead) return;

  //   const handleElectionCreated = (electionId, name, startTime, endTime) => {
  //     console.log(`Election Created: ID ${electionId}, Name: ${name}`);
  //     const newElection = {
  //       id: Number(electionId),
  //       name,
  //       active: true, // assuming new elections are active
  //       startTime: Number(startTime),
  //       endTime: Number(endTime),
  //       officeCount: 0, // update this if your contract provides officeCount on creation
  //     };

  //     // Update the elections list by appending the new election
  //     setElectionsList(prevList => [...prevList, newElection]);
  //     setStatusMessage(`Election ${name} created successfully`);
  //   };

  //   // Listen for the ElectionCreated event
  //   votingContractRead.on("ElectionCreated", handleElectionCreated);

  //   // Clean up when component unmounts or votingContractRead changes
  //   return () => {
  //     votingContractRead.off("ElectionCreated", handleElectionCreated);
  //   };
  // }, [votingContractRead]);

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
      {handleSuccess("Elections fetched successfully")}
    } catch (error) {
      console.error("Error fetching elections from events:", error);
      setStatusMessage("Error fetching elections");
      {handleError("Error fetching elections")}
    } finally {
      setLoading(false);
    }
  };

  const handleSelectElection = async (election) => {
    try {
      setLoading(true);
      setSelectedElectionId(election.id);
      setSelectedElectionDetails(election);

      // ------------------------------
      // 1. Query OfficeAdded events for this election
      // ------------------------------
      const officeAddedFilter = votingContractRead.filters.OfficeAdded(
        election.id
      );
      const officeAddedEvents = await votingContractRead.queryFilter(
        officeAddedFilter,
        deploymentBlock,
        "latest"
      );
      // Build a mapping from office index to office name.
      const officeNameMap = {};
      officeAddedEvents.forEach((event) => {
        const officeIndex = Number(event.args.officeIndex);
        officeNameMap[officeIndex] = event.args.officeName;
      });

      // ------------------------------
      // 2. For each office, reconstruct candidate data via events.
      // ------------------------------
      const offices = [];
      for (let i = 0; i < election.officeCount; i++) {
        // For CandidateAdded events, only electionId is indexed.
        // So we filter by electionId first, then manually filter for the office index.
        const candidateAddedFilter = votingContractRead.filters.CandidateAdded(
          election.id
        );
        const candidateAddedEvents = await votingContractRead.queryFilter(
          candidateAddedFilter,
          deploymentBlock,
          "latest"
        );
        // Manually filter events for the current office index.
        const candidateEventsForOffice = candidateAddedEvents.filter(
          (event) => Number(event.args.officeIndex) === i
        );

        // Build candidate objects from the filtered events.
        let candidateResults = candidateEventsForOffice.map((event) => ({
          candidateIndex: Number(event.args.candidateIndex),
          name: event.args.candidateName,
          voteCount: 0, // initialize vote count to 0
        }));

        // Similarly, for VoteCast events, only electionId is indexed.
        const voteCastFilter = votingContractRead.filters.VoteCast(election.id);
        const voteCastEvents = await votingContractRead.queryFilter(
          voteCastFilter,
          deploymentBlock,
          "latest"
        );
        // Manually filter vote events for the current office index.
        const voteEventsForOffice = voteCastEvents.filter(
          (event) => Number(event.args.officeIndex) === i
        );

        // Tally vote counts from vote events.
        voteEventsForOffice.forEach((event) => {
          const candidateIndex = Number(event.args.candidateIndex);
          const candidate = candidateResults.find(
            (c) => c.candidateIndex === candidateIndex
          );
          if (candidate) {
            candidate.voteCount += 1;
          }
        });

        // Calculate total votes for the office.
        const totalVotes = candidateResults.reduce(
          (sum, candidate) => sum + candidate.voteCount,
          0
        );
        // Compute vote percentages for each candidate.
        const candidatesWithPercentage = candidateResults.map((candidate) => ({
          name: candidate.name,
          voteCount: candidate.voteCount,
          percentage:
            totalVotes > 0
              ? Math.round((candidate.voteCount / totalVotes) * 100)
              : 0,
        }));
        // Sort candidates by vote count (descending).
        candidatesWithPercentage.sort((a, b) => b.voteCount - a.voteCount);

        offices.push({
          officeIndex: i,
          officeName: officeNameMap[i] || `Office ${i + 1}`,
          candidates: candidatesWithPercentage,
          totalVotes,
        });
      }

      setOfficeResults(offices);
      setStatusMessage(`Results for election ${election.id} loaded`);
      {handleSuccess(`Results for election ${election.id} loaded`)}

      // Scroll to results after they're loaded.
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Error loading election results from events:", error);
      setStatusMessage("Error loading election results");
      {handleError("Error loading election results")}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Election Results</h1>
      {statusMessage && (
        <div className="card mb-4" style={{ padding: "0.75rem 1.5rem" }}>
          <p style={{ margin: 0 }}>{statusMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center">
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p>Loading results...</p>
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <h2>Select an Election</h2>
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
                          election.active &&
                          Date.now() / 1000 <= election.endTime
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {election.active &&
                        Date.now() / 1000 <= election.endTime
                          ? "Active"
                          : "Ended"}
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
                          <span className="election-card-info-label">
                            Start:
                          </span>
                          <span className="election-card-info-value">
                            {new Date(
                              election.startTime * 1000
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="election-card-info-item">
                          <span className="election-card-info-label">End:</span>
                          <span className="election-card-info-value">
                            {new Date(election.endTime * 1000).toLocaleString()}
                          </span>
                        </div>
                        <div className="election-card-info-item">
                          <span className="election-card-info-label">
                            Offices:
                          </span>
                          <span className="election-card-info-value">
                            {election.officeCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="election-card-footer">
                      <button onClick={() => handleSelectElection(election)}>
                        View Results
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No elections found.</p>
            )}
          </div>

          {selectedElectionId && (
            <div className="results-container fade-in" ref={resultsRef}>
              <div className="card">
                <h2>Results: {selectedElectionDetails.name}</h2>
                <p>
                  Election{" "}
                  {selectedElectionDetails.active &&
                  Date.now() / 1000 <= selectedElectionDetails.endTime
                    ? "is active"
                    : "has ended"}{" "}
                  •
                  {selectedElectionDetails.active &&
                  Date.now() / 1000 <= selectedElectionDetails.endTime
                    ? " Results are preliminary"
                    : " Final results"}
                </p>

                {officeResults.length > 0 ? (
                  officeResults.map((office, idx) => (
                    <div key={idx} className="office-results">
                      <h3>{office.officeName}</h3>
                      <p>Total votes: {office.totalVotes}</p>

                      {office.candidates.length > 0 ? (
                        office.candidates.map((candidate, i) => (
                          <div key={i} className="mb-4">
                            <div className="candidate-info">
                              <span className="candidate-name">
                                {candidate.name}
                              </span>
                              <span className="candidate-votes">
                                {candidate.voteCount} votes (
                                {candidate.percentage}%)
                              </span>
                            </div>
                            <div
                              className="candidate-bar"
                              style={{
                                width: `${candidate.percentage}%`,
                                minWidth: "2%",
                                backgroundColor:
                                  i === 0
                                    ? "var(--primary)"
                                    : "var(--secondary)",
                              }}
                            ></div>
                          </div>
                        ))
                      ) : (
                        <p>No candidates found for this office.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No office results available.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ElectionResults;
