import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import contractABI from "../abis/VotingSystem.json";
import { useWeb3Auth } from "../Web3AuthContext";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
console.log(contractAddress)

function ElectionResults() {
  const { provider, loggedIn } = useWeb3Auth();
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [electionId, setElectionId] = useState("");
  const [electionData, setElectionData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  // Fetch election details and candidate list.
  const getElectionData = async () => {
    if (!votingContract || !electionId) return;
    try {
      // Assumes your contract has a getElectionDetails() function.
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
      if (provider) {
        try {
          // Wrap the Web3Auth provider with ethers.js
          const ethersProvider = new BrowserProvider(provider);
          const signer = ethersProvider.getSigner();
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length) {
            setAccount(accounts[0]);
            const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
            setVotingContract(contract);
          }
        } catch (error) {
          console.error("Error initializing ElectionResults:", error);
          setStatusMessage("Error initializing ElectionResults.");
        }
      }
    };
    init();
  }, [provider]);

  if (!loggedIn) {
    return (
      <div style={{ padding: "20px" }}>
        Please log in to access election results.
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Election Results</h1>
      {account ? <p>Connected as: {account}</p> : <p>Loading account...</p>}
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
