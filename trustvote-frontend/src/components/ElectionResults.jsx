import React, { useState, useEffect } from "react";
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

  // ----------------- Initialization -----------------
  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          const ethersProvider = new BrowserProvider(provider, 11155111);
          ethersProvider.skipFetchAccounts = true;
          const accounts = await ethersProvider.send("eth_accounts", []);
          if (accounts.length) {
            setAccount(accounts[0]);
            const contractRead = new ethers.Contract(contractAddress, contractABI.abi, ethersProvider);
            setVotingContractRead(contractRead);
          }
        } catch (error) {
          console.error("Error initializing election results page:", error);
          setStatusMessage("Error initializing page");
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

  // ----------------- Election Selection and Results -----------------
  const handleSelectElection = async (election) => {
    setSelectedElectionId(election.id);
    setSelectedElectionDetails(election);
    let offices = [];
    // Loop through each office for the election (from 0 to officeCount-1)
    for (let i = 0; i < election.officeCount; i++) {
      const candidates = await votingContractRead.getCandidates(election.id, i);
      // Convert returned candidate objects to plain JS objects
      const candidateResults = candidates.map((c) => ({
        name: c.name,
        voteCount: Number(c.voteCount),
      }));
      offices.push({
        officeIndex: i,
        officeName: "Office " + i, // Replace with actual office name if available
        candidates: candidateResults,
      });
    }
    setOfficeResults(offices);
    setStatusMessage(`Results for election ${election.id} loaded`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Election Results</h1>
      {statusMessage && <p style={{ color: "green" }}>{statusMessage}</p>}
      {!account ? (
        <p>Loading account information...</p>
      ) : (
        <>
          <button onClick={handleViewElections}>Refresh Elections List</button>
          {electionsList.length > 0 ? (
            <table border="1" cellPadding="8" style={{ marginTop: "10px", width: "100%" }}>
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
                    <td>{(election.active && (Date.now() / 1000) <= election.endTime) ? "Yes" : "No"}</td>
                    <td>{new Date(election.startTime * 1000).toLocaleString()}</td>
                    <td>{new Date(election.endTime * 1000).toLocaleString()}</td>
                    <td>{election.officeCount}</td>
                    <td>
                      <button onClick={() => handleSelectElection(election)}>View Results</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No elections found.</p>
          )}

          {selectedElectionId && (
            <div style={{ marginTop: "20px" }}>
              <h2>
                Results for Election {selectedElectionId} - {selectedElectionDetails.name}
              </h2>
              {officeResults.length > 0 ? (
                officeResults.map((office, idx) => (
                  <div key={idx} style={{ marginBottom: "20px" }}>
                    <h3>{office.officeName}</h3>
                    {office.candidates.length > 0 ? (
                      <table border="1" cellPadding="8">
                        <thead>
                          <tr>
                            <th>Candidate Name</th>
                            <th>Vote Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {office.candidates.map((cand, i) => (
                            <tr key={i}>
                              <td>{cand.name}</td>
                              <td>{cand.voteCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No candidates found for this office.</p>
                    )}
                  </div>
                ))
              ) : (
                <p>No office results available.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ElectionResults;
