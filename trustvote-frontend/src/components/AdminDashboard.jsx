import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import contractABI from "../abis/VotingSystem.json";

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

function AdminDashboard() {
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  
  // Form states
  const [electionName, setElectionName] = useState("");
  const [electionId, setElectionId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [voterAddress, setVoterAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

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

          // Check if the connected account is admin
          const adminStatus = await contract.hasRole(ADMIN_ROLE, accounts[0]);
          setIsAdmin(adminStatus);
        }
      }
    };
    init();
  }, []);

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

  if (!account) {
    return <div style={{ padding: "20px" }}>Please connect your wallet from the Home page.</div>;
  }

  if (!isAdmin) {
    return <div style={{ padding: "20px" }}>Access denied. You are not an admin.</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>
      <p>Connected as: {account?.address}</p>
      {statusMessage && <p>{statusMessage}</p>}

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

      <div style={{ border: "1px solid #ccc", padding: "10px" }}>
        <h3>Register Voter</h3>
        <input
          type="text"
          placeholder="Voter Address"
          value={voterAddress}
          onChange={(e) => setVoterAddress(e.target.value)}
        />
        <button onClick={handleRegisterVoter}>Register Voter</button>
      </div>
    </div>
  );
}

export default AdminDashboard;
