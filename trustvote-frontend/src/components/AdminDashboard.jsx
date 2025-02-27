import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import contractABI from "../abis/VotingSystem.json";
import { useWeb3Auth } from "../Web3AuthContext";
import { Web3Auth } from "@web3auth/modal";


const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

function AdminDashboard() {
  const { provider, loggedIn } = useWeb3Auth();
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);       // Writeable instance (with signer)
  const [votingContractRead, setVotingContractRead] = useState(null); // Read-only instance (with provider)
  const [statusMessage, setStatusMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // States for Admin CRUD
  const [newAdmin, setNewAdmin] = useState("");
  const [removeAdminAddr, setRemoveAdminAddr] = useState("");
  const [oldAdmin, setOldAdmin] = useState("");
  const [updateAdminAddr, setUpdateAdminAddr] = useState("");
  const [adminsList, setAdminsList] = useState([]);

  // States for Voter CRUD
  const [newVoter, setNewVoter] = useState("");
  const [removeVoterAddr, setRemoveVoterAddr] = useState("");
  const [oldVoter, setOldVoter] = useState("");
  const [updateVoterAddr, setUpdateVoterAddr] = useState("");
  const [votersList, setVotersList] = useState([]);

  // States for Election CRUD
  const [electionName, setElectionName] = useState("");
  const [electionStartTime, setElectionStartTime] = useState("");
  const [electionEndTime, setElectionEndTime] = useState("");
  const [updateElectionId, setUpdateElectionId] = useState("");
  const [updateElectionName, setUpdateElectionName] = useState("");
  const [updateElectionStartTime, setUpdateElectionStartTime] = useState("");
  const [updateElectionEndTime, setUpdateElectionEndTime] = useState("");
  const [deleteElectionId, setDeleteElectionId] = useState("");
  const [endElectionId, setEndElectionId] = useState("");

  // States for Office & Candidate CRUD
  const [officeElectionId, setOfficeElectionId] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [candidateElectionId, setCandidateElectionId] = useState("");
  const [officeIndex, setOfficeIndex] = useState("");
  const [candidateName, setCandidateName] = useState("");

  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          // Create a BrowserProvider using the Web3Auth provider and Sepolia's chain id (11155111)
          const ethersProvider = new BrowserProvider(provider, 11155111);
          // create a signer
          const signer = ethersProvider.getSigner();


          ethersProvider.skipFetchAccounts = true;
          // Manually fetch accounts using "eth_accounts"
          const accounts = await ethersProvider.send("eth_accounts", []);
          if (accounts.length) {
            setAccount(accounts[0]);
            // Create a read-only contract instance
            const contractRead = new ethers.Contract(
              contractAddress,
              contractABI.abi,
              ethersProvider
            );
            // // Create a write contract instance
            // const contractWithSigner = new ethers.Contract(
            //   contractAddress,
            //   contractABI.abi,
            //   signer
            // );
            // Check if the connected account has the ADMIN_ROLE
            const adminStatus = await contractRead.hasRole(ADMIN_ROLE, accounts[0]);
            setIsAdmin(adminStatus);
            // For write operations, get the signer and connect it to the contract

            // Retrieve the private key using the provider's request method
            const pk = await provider.request({ method: "eth_private_key" });
            // Create a Wallet signer using the private key and the ethers provider
            const walletSigner = new ethers.Wallet(pk, ethersProvider);
            console.log("private key :" + pk)

            // Connect the walletSigner to the contract for state-changing operations
            const contractWithSigner = contractRead.connect(walletSigner);
            setVotingContract(contractWithSigner);
            setVotingContractRead(contractRead);
          }
        } catch (error) {
          console.error("Error initializing admin dashboard:", error);
          setStatusMessage("Error initializing dashboard");
        }
      }
    };
    init();
  }, [provider]);

  // --------- Admin CRUD Functions ---------
  const handleAddAdmin = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.addAdmin(newAdmin);
      await tx.wait();
      setStatusMessage("Admin added successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding admin");
    }
  };

  const handleRemoveAdmin = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.removeAdmin(removeAdminAddr);
      await tx.wait();
      setStatusMessage("Admin removed successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error removing admin");
    }
  };

  const handleUpdateAdmin = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.updateAdmin(oldAdmin, updateAdminAddr);
      await tx.wait();
      setStatusMessage("Admin updated successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error updating admin");
    }
  };

  const handleViewAdmins = async () => {
    if (!votingContract) return;
    try {
      const admins = await votingContract.viewAdmins();
      setAdminsList(admins);
      setStatusMessage("Admins fetched successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching admins");
    }
  };

  // --------- Voter CRUD Functions ---------
  const handleRegisterVoter = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.registerVoter(newVoter);
      await tx.wait();
      setStatusMessage("Voter registered successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error registering voter");
    }
  };

  const handleRemoveVoter = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.removeVoter(removeVoterAddr);
      await tx.wait();
      setStatusMessage("Voter removed successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error removing voter");
    }
  };

  const handleUpdateVoter = async () => {
    if (!votingContract) return;
    try {
      const tx = await votingContract.updateVoter(oldVoter, updateVoterAddr);
      await tx.wait();
      setStatusMessage("Voter updated successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error updating voter");
    }
  };

  const handleViewVoters = async () => {
    if (!votingContract) return;
    try {
      const voters = await votingContract.viewVoters();
      setVotersList(voters);
      setStatusMessage("Voters fetched successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error fetching voters");
    }
  };

  // --------- Election CRUD Functions ---------
  const handleCreateElection = async () => {
    if (!votingContract) return;
    try {
      const start = Number(electionStartTime);
      const end = Number(electionEndTime);
      const tx = await votingContract.createElection(electionName, start, end);
      await tx.wait();
      setStatusMessage("Election created successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error creating election");
    }
  };

  const handleUpdateElection = async () => {
    if (!votingContract) return;
    try {
      const electionId = Number(updateElectionId);
      const start = Number(updateElectionStartTime);
      const end = Number(updateElectionEndTime);
      const tx = await votingContract.updateElection(electionId, updateElectionName, start, end);
      await tx.wait();
      setStatusMessage("Election updated successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error updating election");
    }
  };

  const handleDeleteElection = async () => {
    if (!votingContract) return;
    try {
      const electionId = Number(deleteElectionId);
      const tx = await votingContract.deleteElection(electionId);
      await tx.wait();
      setStatusMessage("Election deleted successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error deleting election");
    }
  };

  const handleEndElection = async () => {
    if (!votingContract) return;
    try {
      const electionId = Number(endElectionId);
      const tx = await votingContract.endElection(electionId);
      await tx.wait();
      setStatusMessage("Election ended successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error ending election");
    }
  };

  // --------- Office & Candidate CRUD Functions ---------
  const handleAddOffice = async () => {
    if (!votingContract) return;
    try {
      const electionId = Number(officeElectionId);
      const tx = await votingContract.addOffice(electionId, officeName);
      await tx.wait();
      setStatusMessage("Office added successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding office");
    }
  };

  const handleAddCandidate = async () => {
    if (!votingContract) return;
    try {
      const electionId = Number(candidateElectionId);
      const officeIdx = Number(officeIndex);
      const tx = await votingContract.addCandidate(electionId, officeIdx, candidateName);
      await tx.wait();
      setStatusMessage("Candidate added successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error adding candidate");
    }
  };

  if (!loggedIn) {
    return <div style={{ padding: "20px" }}>Please log in to access the admin dashboard.</div>;
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

      <h2>Admin Operations</h2>
      <div>
        <h3>Add Admin</h3>
        <input type="text" placeholder="New admin address" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
        <button onClick={handleAddAdmin}>Add Admin</button>
      </div>
      <div>
        <h3>Remove Admin</h3>
        <input type="text" placeholder="Admin address to remove" value={removeAdminAddr} onChange={(e) => setRemoveAdminAddr(e.target.value)} />
        <button onClick={handleRemoveAdmin}>Remove Admin</button>
      </div>
      <div>
        <h3>Update Admin</h3>
        <input type="text" placeholder="Old admin address" value={oldAdmin} onChange={(e) => setOldAdmin(e.target.value)} />
        <input type="text" placeholder="New admin address" value={updateAdminAddr} onChange={(e) => setUpdateAdminAddr(e.target.value)} />
        <button onClick={handleUpdateAdmin}>Update Admin</button>
      </div>
      <div>
        <h3>View Admins</h3>
        <button onClick={handleViewAdmins}>View Admins</button>
        {adminsList.length > 0 && (
          <ul>
            {adminsList.map((admin, index) => (
              <li key={index}>{admin}</li>
            ))}
          </ul>
        )}
      </div>

      <h2>Voter Operations</h2>
      <div>
        <h3>Register Voter</h3>
        <input type="text" placeholder="Voter address" value={newVoter} onChange={(e) => setNewVoter(e.target.value)} />
        <button onClick={handleRegisterVoter}>Register Voter</button>
      </div>
      <div>
        <h3>Remove Voter</h3>
        <input type="text" placeholder="Voter address to remove" value={removeVoterAddr} onChange={(e) => setRemoveVoterAddr(e.target.value)} />
        <button onClick={handleRemoveVoter}>Remove Voter</button>
      </div>
      <div>
        <h3>Update Voter</h3>
        <input type="text" placeholder="Old voter address" value={oldVoter} onChange={(e) => setOldVoter(e.target.value)} />
        <input type="text" placeholder="New voter address" value={updateVoterAddr} onChange={(e) => setUpdateVoterAddr(e.target.value)} />
        <button onClick={handleUpdateVoter}>Update Voter</button>
      </div>
      <div>
        <h3>View Voters</h3>
        <button onClick={handleViewVoters}>View Voters</button>
        {votersList.length > 0 && (
          <ul>
            {votersList.map((voter, index) => (
              <li key={index}>{voter}</li>
            ))}
          </ul>
        )}
      </div>

      <h2>Election Operations</h2>
      <div>
        <h3>Create Election</h3>
        <input type="text" placeholder="Election Name" value={electionName} onChange={(e) => setElectionName(e.target.value)} />
        <input type="text" placeholder="Start Time (unix timestamp)" value={electionStartTime} onChange={(e) => setElectionStartTime(e.target.value)} />
        <input type="text" placeholder="End Time (unix timestamp)" value={electionEndTime} onChange={(e) => setElectionEndTime(e.target.value)} />
        <button onClick={handleCreateElection}>Create Election</button>
      </div>
      <div>
        <h3>Update Election</h3>
        <input type="text" placeholder="Election ID" value={updateElectionId} onChange={(e) => setUpdateElectionId(e.target.value)} />
        <input type="text" placeholder="New Election Name" value={updateElectionName} onChange={(e) => setUpdateElectionName(e.target.value)} />
        <input type="text" placeholder="New Start Time (unix timestamp)" value={updateElectionStartTime} onChange={(e) => setUpdateElectionStartTime(e.target.value)} />
        <input type="text" placeholder="New End Time (unix timestamp)" value={updateElectionEndTime} onChange={(e) => setUpdateElectionEndTime(e.target.value)} />
        <button onClick={handleUpdateElection}>Update Election</button>
      </div>
      <div>
        <h3>Delete Election</h3>
        <input type="text" placeholder="Election ID to delete" value={deleteElectionId} onChange={(e) => setDeleteElectionId(e.target.value)} />
        <button onClick={handleDeleteElection}>Delete Election</button>
      </div>
      <div>
        <h3>End Election</h3>
        <input type="text" placeholder="Election ID to end" value={endElectionId} onChange={(e) => setEndElectionId(e.target.value)} />
        <button onClick={handleEndElection}>End Election</button>
      </div>

      <h2>Office & Candidate Operations</h2>
      <div>
        <h3>Add Office</h3>
        <input type="text" placeholder="Election ID for Office" value={officeElectionId} onChange={(e) => setOfficeElectionId(e.target.value)} />
        <input type="text" placeholder="Office Name" value={officeName} onChange={(e) => setOfficeName(e.target.value)} />
        <button onClick={handleAddOffice}>Add Office</button>
      </div>
      <div>
        <h3>Add Candidate</h3>
        <input type="text" placeholder="Election ID for Candidate" value={candidateElectionId} onChange={(e) => setCandidateElectionId(e.target.value)} />
        <input type="text" placeholder="Office Index" value={officeIndex} onChange={(e) => setOfficeIndex(e.target.value)} />
        <input type="text" placeholder="Candidate Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
        <button onClick={handleAddCandidate}>Add Candidate</button>
      </div>
    </div>
  );
}

export default AdminDashboard;
