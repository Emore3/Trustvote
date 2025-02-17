import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import contractABI from "../abis/VotingSystem.json";

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const VOTER_ROLE = keccak256(toUtf8Bytes("VOTER_ROLE"));

function VoterDashboard() {
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [voteElectionId, setVoteElectionId] = useState("");
  const [candidateIndex, setCandidateIndex] = useState("");
  const [isVoter, setIsVoter] = useState(false);

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
          // Check if connected account is a registered voter
          const voterStatus = await contract.hasRole(VOTER_ROLE, accounts[0]);
          setIsVoter(voterStatus);
        }
      }
    };
    init();
  }, []);

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

  if (!account) {
    return <div style={{ padding: "20px" }}>Please connect your wallet from the Home page.</div>;
  }

  if (!isVoter) {
    return <div style={{ padding: "20px" }}>Access denied. You are not a registered voter.</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Voter Dashboard</h1>
      <p>Connected as: {account?.address}</p>
      {statusMessage && <p>{statusMessage}</p>}

      <div style={{ border: "1px solid #ccc", padding: "10px" }}>
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
    </div>
  );
}

export default VoterDashboard;
