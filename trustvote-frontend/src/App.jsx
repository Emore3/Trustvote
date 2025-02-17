import React, { useState, useEffect } from "react";
import contractABI from "./abis/VotingSystem.json";
import { BrowserProvider, ethers } from "ethers";
const provider = new BrowserProvider(window.ethereum);

// Replace with your deployed contract address
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

function App() {
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Form states for various actions
  const [electionName, setElectionName] = useState("");
  const [electionId, setElectionId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [voterAddress, setVoterAddress] = useState("");
  const [voteElectionId, setVoteElectionId] = useState("");
  const [candidateIndex, setCandidateIndex] = useState("");

  // On component mount, set up the provider if MetaMask is available
  useEffect(() => {
    if (window.ethereum) {
      const _provider = new BrowserProvider(window.ethereum);;
      setProvider(_provider);
    }
  }, []);

  // Connect to MetaMask and initialize the contract
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const accountAddress = await signer.getAddress();
      setAccount(accountAddress);
      const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
      setVotingContract(contract);
    } catch (error) {
      console.error(error);
      setStatusMessage("Error connecting wallet");
    }
  };

  // Admin: Create an election
  const handleCreateElection = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.createElection(electionName);
      await tx.wait();
      setStatusMessage("Election created successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error creating election");
    }
  };

  // Admin: Add a candidate to an election
  const handleAddCandidate = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.addCandidate(electionId, candidateName);
      await tx.wait();
      setStatusMessage("Candidate added successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding candidate");
    }
  };

  // Admin: Register a voter
  const handleRegisterVoter = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.registerVoter(voterAddress);
      await tx.wait();
      setStatusMessage("Voter registered successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error registering voter");
    }
  };

  // Voter: Cast a vote
  const handleVote = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.vote(voteElectionId, candidateIndex);
      await tx.wait();
      setStatusMessage("Vote cast successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error casting vote");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Blockchain Voting System</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>
          <strong>Connected as:</strong> {account}
        </p>
      )}

      <h2>Admin Panel</h2>
      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
        <h3>Create Election</h3>
        <input
          type="text"
          placeholder="Election Name"
          value={electionName}
          onChange={(e) => setElectionName(e.target.value)}
        />
        <button onClick={handleCreateElection}>Create Election</button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
        <h3>Add Candidate</h3>
        <input
          type="text"
          placeholder="Election ID"
          value={electionId}
          onChange={(e) => setElectionId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Candidate Name"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
        />
        <button onClick={handleAddCandidate}>Add Candidate</button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
        <h3>Register Voter</h3>
        <input
          type="text"
          placeholder="Voter Address"
          value={voterAddress}
          onChange={(e) => setVoterAddress(e.target.value)}
        />
        <button onClick={handleRegisterVoter}>Register Voter</button>
      </div>

      <h2>Voter Panel</h2>
      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
        <h3>Cast Vote</h3>
        <input
          type="text"
          placeholder="Election ID"
          value={voteElectionId}
          onChange={(e) => setVoteElectionId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Candidate Index"
          value={candidateIndex}
          onChange={(e) => setCandidateIndex(e.target.value)}
        />
        <button onClick={handleVote}>Vote</button>
      </div>

      {statusMessage && <p>{statusMessage}</p>}
    </div>
  );
}

export default App;
