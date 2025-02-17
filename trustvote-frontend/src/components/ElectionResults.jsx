import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import contractABI from "../abis/VotingSystem.json";

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

function ElectionResults() {
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [electionId, setElectionId] = useState("");
  const [electionData, setElectionData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  // Function to fetch election details and candidate list.
  const getElectionData = async () => {
    if (!votingContract || !electionId) return;
    try {
      // This call assumes your contract has a getElectionDetails() function.
      const result = await votingContract.getElectionDetails(electionId);
      const name = result[0];
      const active = result[1];
      const candidateCount = Number(result[2]);

      // Fetch candidates via getCandidates()
      const candidateList = await votingContract.getCandidates(electionId);
      setElectionData({ name, active, candidateCount });
      setCandidates(candidateList);
      setStatusMessage("");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching election data. Ensure the election ID is correct.");
    }
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accounts = await provider.listAccounts();
        if (accounts.length) {
          setAccount(accounts[0]);
          const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
          setVotingContract(contract);
        }
      }
    };
    init();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Election Results</h1>
      {account ? <p>Connected as: {account?.address}</p> : <p>Please connect your wallet.</p>}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter Election ID"
          value={electionId}
          onChange={(e) => setElectionId(e.target.value)}
        />
        <button onClick={getElectionData}>Get Election Data</button>
      </div>
      {statusMessage && <p>{statusMessage}</p>}
      {electionData && (
        <div>
          <h2>Election: {electionData.name}</h2>
          <p>Status: {electionData.active ? "Active" : "Ended"}</p>
          <p>Total Candidates: {electionData.candidateCount}</p>
          <h3>Candidates</h3>
          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Index</th>
                <th>Name</th>
                <th>Vote Count</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, index) => (
                <tr key={index}>
                  <td>{index}</td>
                  <td>{candidate.name}</td>
                  <td>{candidate.voteCount.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ElectionResults;
