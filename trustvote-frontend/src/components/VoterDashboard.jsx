import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers";
import contractABI from "../abis/VotingSystem.json";
import { useWeb3Auth } from "../Web3AuthContext";
import { log } from "@web3auth/base";

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

  // Elections and selection
  const [electionsList, setElectionsList] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [selectedElectionDetails, setSelectedElectionDetails] = useState(null);

  // Vote casting inputs
  const [officeIndex, setOfficeIndex] = useState("");
  const [candidateIndex, setCandidateIndex] = useState("");

  const [loading, setLoading] = useState(false);

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
            console.log("Private key:", pk);
            // Create a wallet signer from the private key
            const walletSigner = new ethers.Wallet(pk, ethersProvider);
            // Create a writeable contract instance by connecting the signer
            const contractWithSigner = contractRead.connect(walletSigner);
            setVotingContract(contractWithSigner);
            setVotingContractRead(contractRead);
          }
        } catch (error) {
          console.error("Error initializing voter dashboard:", error);
          setStatusMessage("Error initializing dashboard");
        } finally {
          console.log("hey");
          setLoading(false)
          console.log(loading);
          
          console.log("hey");

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

  const handleSelectElection = (election) => {
    setSelectedElectionId(election.id);
    setSelectedElectionDetails(election);
    setStatusMessage(`Election ${election.id} selected`);
  };

  // ----------------- Vote Casting Function -----------------
  const handleCastVote = async () => {
    if (!votingContract || !selectedElectionId) return;
    try {
      const officeIdx = Number(officeIndex);
      const candidateIdx = Number(candidateIndex);
      const tx = await votingContract.vote(
        selectedElectionId,
        officeIdx,
        candidateIdx
      );
      await tx.wait();
      setStatusMessage("Vote cast successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error casting vote");
    }
  };

  // ----------------- Sidebar Component -----------------
  const Sidebar = () => (
    <div
      style={{
        width: "250px",
        background: "#e8f0fe",
        padding: "20px",
        height: "100vh",
      }}
    >
      <h3 style={{ color: "black" }}>Voter Dashboard</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li
          style={{
            marginBottom: "10px",
            cursor: "pointer",
            color: currentSection === "elections" ? "blue" : "black",
          }}
          onClick={() => {
            setCurrentSection("elections");
            handleViewElections();
          }}
        >
          Available Elections
        </li>
        <li
          style={{
            marginBottom: "10px",
            cursor: "pointer",
            color: currentSection === "vote" ? "blue" : "black",
          }}
          onClick={() => setCurrentSection("vote")}
        >
          Cast Vote
        </li>
        {/* You could add another item for Election Results if desired */}
      </ul>
    </div>
  );

  // ----------------- Render Sections -----------------
  const renderSection = () => {
    switch (currentSection) {
      case "elections":
        return (
          <div>
            <h2>Available Elections</h2>
            {electionsList.length > 0 ? (
              <table
                border="1"
                cellPadding="8"
                style={{ marginTop: "10px", width: "100%" }}
              >
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
                      <td>
                        {new Date(election.startTime * 1000).toLocaleString()}
                      </td>
                      <td>
                        {new Date(election.endTime * 1000).toLocaleString()}
                      </td>
                      <td>{election.officeCount}</td>
                      <td>
                        <button onClick={() => handleSelectElection(election)}>
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No elections found.</p>
            )}
          </div>
        );
      case "vote":
        return (
          <div>
            <h2>Cast Your Vote</h2>
            {selectedElectionId ? (
              <div>
                <p>
                  Selected Election ID: <strong>{selectedElectionId}</strong> -{" "}
                  <strong>{selectedElectionDetails?.name}</strong>
                </p>
                <div>
                  <label>
                    Office Index:{" "}
                    <input
                      type="number"
                      value={officeIndex}
                      onChange={(e) => setOfficeIndex(e.target.value)}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Candidate Index:{" "}
                    <input
                      type="number"
                      value={candidateIndex}
                      onChange={(e) => setCandidateIndex(e.target.value)}
                    />
                  </label>
                </div>
                <button onClick={handleCastVote}>Cast Vote</button>
              </div>
            ) : (
              <p>
                Please select an election first from the Available Elections
                section.
              </p>
            )}
          </div>
        );
      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };

  if (loading || !account) {
    return (
      <div style={{position: "fixed", top: 0, left: 0, background: "black", height: "100dvh", width: "100%", display: "flex", justifyContent: "center", alignItems: "center"}}>
        <p className="">
          Loading
        </p>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div style={{ padding: "20px" }}>
        Please log in to access the voter dashboard.
      </div>
    );
  }
  // if (!account) {
  //   return (
  //     <div style={{ padding: "20px" }}>Loading account information...</div>
  //   );
  // }
  if (!isVoter) {
    return (
      <div style={{ padding: "20px" }}>
        Access denied. You are not a registered voter.
      </div>
    );
  }

  

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        {statusMessage && <p style={{ color: "green" }}>{statusMessage}</p>}
        {renderSection()}
      </div>
    </div>
  );
}

export default VoterDashboard;
