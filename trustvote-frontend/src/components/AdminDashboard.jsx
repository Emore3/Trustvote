import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import contractABI from "../abis/VotingSystem.json";
import { useWeb3Auth } from "../Web3AuthContext";

const contractAddress = import.meta.env.CONTRACT_ADDRESS;
const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

function AdminDashboard() {
  const { provider, loggedIn } = useWeb3Auth();
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Form states
  const [electionName, setElectionName] = useState("");
  const [electionId, setElectionId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [voterAddress, setVoterAddress] = useState("");

  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          // Create a BrowserProvider using the Web3Auth provider and the Sepolia chain ID (11155111)
          const ethersProvider = new BrowserProvider(provider, 11155111);
          // Disable automatic fetching of accounts
          ethersProvider.skipFetchAccounts = true;
          // Manually fetch accounts using the "eth_accounts" RPC call
          const accounts = await ethersProvider.send("eth_accounts", []);
          if (accounts.length) {
            setAccount(accounts[0]);
            // Create a read-only contract instance using the provider
            const contractRead = new ethers.Contract(
              contractAddress,
              contractABI.abi,
              ethersProvider
            );
            // Check if the connected account has the ADMIN_ROLE
            const adminStatus = await contractRead.hasRole(ADMIN_ROLE, accounts[0]);
            setIsAdmin(adminStatus);
            // For write operations, obtain the signer
            const signer = ethersProvider.getSigner();
            // (Optional) Try logging the connected address from the signer
            console.log("Fetched account:", accounts[0]);
            try {
              const connectedAddress = await signer.getAddress();
              console.log("Connected address (from signer):", connectedAddress);
            } catch (err) {
              console.log("Signer.getAddress() not available, using manually fetched account.");
            }
            // Connect the contract to the signer for write methods
            const contractWithSigner = contractRead.connect(signer);
            setVotingContract(contractWithSigner);
          }
        } catch (error) {
          console.error("Error initializing admin dashboard:", error);
          setStatusMessage("Error initializing dashboard");
        }
      }
    };
    init();
  }, [provider]);

  if (!loggedIn) {
    return (
      <div style={{ padding: "20px" }}>
        Please log in to access the admin dashboard.
      </div>
    );
  }

  if (!account) {
    return <div style={{ padding: "20px" }}>Loading account information...</div>;
  }

  if (!isAdmin) {
    return <div style={{ padding: "20px" }}>Access denied. You are not an admin.</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>
      <p>Connected as: {account}</p>
      {statusMessage && <p>{statusMessage}</p>}

      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
        <h3>Create Election</h3>
        <input
          type="text"
          placeholder="Election Name"
          value={electionName}
          onChange={(e) => setElectionName(e.target.value)}
        />
        <button
          onClick={async () => {
            if (!votingContract) return;
            try {
              const tx = await votingContract.createElection(electionName);
              await tx.wait();
              setStatusMessage("Election created successfully");
            } catch (error) {
              console.error(error);
              setStatusMessage("Error creating election");
            }
          }}
        >
          Create Election
        </button>
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
        <button
          onClick={async () => {
            if (!votingContract) return;
            try {
              const tx = await votingContract.addCandidate(electionId, candidateName);
              await tx.wait();
              setStatusMessage("Candidate added successfully");
            } catch (error) {
              console.error(error);
              setStatusMessage("Error adding candidate");
            }
          }}
        >
          Add Candidate
        </button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "10px" }}>
        <h3>Register Voter</h3>
        <input
          type="text"
          placeholder="Voter Address"
          value={voterAddress}
          onChange={(e) => setVoterAddress(e.target.value)}
        />
        <button
          onClick={async () => {
            if (!votingContract) return;
            try {
              const tx = await votingContract.registerVoter(voterAddress);
              await tx.wait();
              setStatusMessage("Voter registered successfully");
            } catch (error) {
              console.error(error);
              setStatusMessage("Error registering voter");
            }
          }}
        >
          Register Voter
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
