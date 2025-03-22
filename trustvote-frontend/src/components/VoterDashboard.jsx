"use client"

import { useState, useEffect } from "react"
import { ethers, BrowserProvider } from "ethers"
import { keccak256, toUtf8Bytes } from "ethers"
import contractABI from "../abis/VotingSystem.json"
import { useWeb3Auth } from "../Web3AuthContext"

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
const VOTER_ROLE = keccak256(toUtf8Bytes("VOTER_ROLE"))

function VoterDashboard() {
  const { provider, loggedIn } = useWeb3Auth()
  const [account, setAccount] = useState(null)
  const [votingContract, setVotingContract] = useState(null) // writeable instance
  const [votingContractRead, setVotingContractRead] = useState(null) // read-only instance
  const [statusMessage, setStatusMessage] = useState("")
  const [isVoter, setIsVoter] = useState(false)
  const [currentSection, setCurrentSection] = useState("elections")
  const [loading, setLoading] = useState(false)

  // Elections and selection
  const [electionsList, setElectionsList] = useState([])
  const [selectedElectionId, setSelectedElectionId] = useState(null)
  const [selectedElectionDetails, setSelectedElectionDetails] = useState(null)
  const [officesList, setOfficesList] = useState([])
  const [selectedOffice, setSelectedOffice] = useState(null)
  const [candidatesList, setCandidatesList] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  // ----------------- Initialization -----------------
  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          setLoading(true)
          // Create a BrowserProvider using the Web3Auth provider and chain id (e.g., Sepolia: 11155111)
          const ethersProvider = new BrowserProvider(provider, 11155111)
          ethersProvider.skipFetchAccounts = true
          // Manually fetch accounts
          const accounts = await ethersProvider.send("eth_accounts", [])
          console.log(accounts)
          if (accounts.length) {
            setAccount(accounts[0])
            // Create a read-only contract instance
            const contractRead = new ethers.Contract(contractAddress, contractABI.abi, ethersProvider)
            // Check if the account has the VOTER_ROLE
            const voterStatus = await contractRead.hasRole(VOTER_ROLE, accounts[0])
            setIsVoter(voterStatus)
            // Retrieve private key using the provider's request method (per Web3Auth instructions)
            const pk = await provider.request({ method: "eth_private_key" })
            // Create a wallet signer from the private key
            const walletSigner = new ethers.Wallet(pk, ethersProvider)
            // Create a writeable contract instance by connecting the signer
            const contractWithSigner = contractRead.connect(walletSigner)
            setVotingContract(contractWithSigner)
            setVotingContractRead(contractRead)

            // Load initial data
            // await handleViewElections()
          }
        } catch (error) {
          console.error("Error initializing voter dashboard:", error)
          setStatusMessage("Error initializing dashboard")
        } finally {
          setLoading(false)
        }
      }
    }
    init()
  }, [provider])

  useEffect(() => {
    // Only try to fetch if the read contract is set and we’re recognized as a voter
    if (votingContractRead && isVoter) {
      handleViewElections()
    }
  }, [votingContractRead, isVoter])

  // ----------------- Elections List Functions -----------------
  const handleViewElections = async () => {
    if (!votingContractRead) return
    try {
      setLoading(true)
      const countBN = await votingContractRead.electionCount()
      const electionCount = Number(countBN.toString())
      const list = []
      for (let i = 1; i <= electionCount; i++) {
        const details = await votingContractRead.getElectionDetails(i)
        // details: [name, active, startTime, endTime, officeCount]
        list.push({
          id: i,
          name: details[0],
          active: details[1],
          startTime: Number(details[2]),
          endTime: Number(details[3]),
          officeCount: Number(details[4]),
        })
      }
      setElectionsList(list)
      setStatusMessage("Elections fetched successfully")
    } catch (error) {
      console.error(error)
      setStatusMessage("Error fetching elections")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectElection = async (election) => {
    setSelectedElectionId(election.id)
    setSelectedElectionDetails(election)
    setStatusMessage(`Election ${election.id} selected`)

    // Reset office and candidate selections
    setSelectedOffice(null)
    setSelectedCandidate(null)

    // Load offices for this election
    try {
      setLoading(true)
      // Create a filter for the OfficeAdded event for this election
      const filter = votingContractRead.filters.OfficeAdded(election.id)
      // Query past events (you can also set fromBlock if needed)
      const events = await votingContractRead.queryFilter(filter)
      const offices = events
      .map((event) => ({
        index: Number(event.args.officeIndex),
        name: event.args.officeName,
      }))
      .sort((a, b) => a.index - b.index)
      setOfficesList(offices)
      
      // Map events to get office objects (ensure sorting by officeIndex)
      // for (let i = 0; i < election.officeCount; i++) {
      //   offices.push({
      //     index: i,
      //     name: `Office ${i + 1}`, // Using index+1 as name since contract doesn't store office names
      //   })
      // }
    } catch (error) {
      console.error(error)
      setStatusMessage("Error loading offices")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOffice = async (office) => {
    setSelectedOffice(office)

    // Load candidates for this office
    try {
      setLoading(true)
      const candidates = await votingContractRead.getCandidates(selectedElectionId, office.index)
      const candidatesList = candidates.map((candidate, index) => ({
        index,
        name: candidate.name,
        voteCount: Number(candidate.voteCount),
      }))
      setCandidatesList(candidatesList)
    } catch (error) {
      console.error(error)
      setStatusMessage("Error loading candidates")
    } finally {
      setLoading(false)
    }
  }

  // ----------------- Vote Casting Function -----------------
  const handleCastVote = async () => {
    if (!votingContract || !selectedElectionId || !selectedOffice || selectedCandidate === null) return
    try {
      setLoading(true)
      const tx = await votingContract.vote(selectedElectionId, selectedOffice.index, selectedCandidate)
      await tx.wait()
      setStatusMessage("Vote cast successfully!")

      // Reset selections after voting
      setSelectedCandidate(null)
    } catch (error) {
      console.error(error)
      setStatusMessage('Error casting vote: ' + error.message.split(" (")[0])
    } finally {
      setLoading(false)
    }
  }

  // ----------------- Render Sections -----------------
  const renderElections = () => (
    <div className="fade-in">
      <h2>Available Elections</h2>
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
                  className={`election-card-status ${election.active && Date.now() / 1000 <= election.endTime ? "active" : "inactive"}`}
                >
                  {election.active && Date.now() / 1000 <= election.endTime ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="election-card-body">
                <div className="election-card-info">
                  <div className="election-card-info-item">
                    <span className="election-card-info-label">ID:</span>
                    <span className="election-card-info-value">{election.id}</span>
                  </div>
                  <div className="election-card-info-item">
                    <span className="election-card-info-label">Start:</span>
                    <span className="election-card-info-value">
                      {new Date(election.startTime * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="election-card-info-item">
                    <span className="election-card-info-label">End:</span>
                    <span className="election-card-info-value">
                      {new Date(election.endTime * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="election-card-info-item">
                    <span className="election-card-info-label">Offices:</span>
                    <span className="election-card-info-value">{election.officeCount}</span>
                  </div>
                </div>
              </div>
              <div className="election-card-footer">
                <button
                  onClick={() => handleSelectElection(election)}
                  disabled={!election.active || Date.now() / 1000 > election.endTime}
                >
                  {election.active && Date.now() / 1000 <= election.endTime ? "Select" : "Ended"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )
       : (
        <div className="card">
          <p>No elections found.</p>
        </div>
      )
      }
    </div>
  )

  const renderVote = () => (
    <div className="fade-in">
      <h2>Cast Your Vote</h2>

      {selectedElectionId ? (
        <div className="card">
          <h3>{selectedElectionDetails?.name}</h3>
          <p>Election ends: {new Date(selectedElectionDetails?.endTime * 1000).toLocaleString()}</p>

          {officesList.length > 0 ? (
            <div className="mt-4">
              <h4>Select an Office</h4>
              <div className="form-group">
                <select
                  value={selectedOffice ? selectedOffice.index : ""}
                  onChange={(e) => {
                    const officeIndex = Number.parseInt(e.target.value)
                    const office = officesList.find((o) => o.index === officeIndex)
                    if (office) handleSelectOffice(office)
                  }}
                >
                  <option value="">-- Select Office --</option>
                  {officesList.map((office) => (
                    <option key={office.index} value={office.index}>
                      {office.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOffice && (
                <div className="mt-4">
                  <h4>Select a Candidate</h4>
                  {candidatesList.length > 0 ? (
                    <div>
                      {candidatesList.map((candidate, idx) => (
                        <div
                          key={idx}
                          className={`candidate-option ${selectedCandidate === candidate.index ? "selected" : ""}`}
                          onClick={() => setSelectedCandidate(candidate.index)}
                        >
                          <div className="candidate-option-header">
                            <span className="candidate-option-name">{candidate.name}</span>
                            {selectedCandidate === candidate.index && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}

                      <button onClick={handleCastVote} disabled={selectedCandidate === null} className="mt-4">
                        Cast Vote
                      </button>
                    </div>
                  ) : (
                    <p>No candidates found for this office.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p>No offices available for this election.</p>
          )}
        </div>
      ) : (
        <div className="card">
          <p>Please select an active election first.</p>
        </div>
      )}
    </div>
  )

  if (loading && !account) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p>Please log in to access the voter dashboard.</p>
        </div>
      </div>
    )
  }

  if (!isVoter) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p>You are not a registered voter. Please contact an administrator to register.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>Voter Dashboard</h3>
        <ul className="sidebar-nav">
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${currentSection === "elections" ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault()
                setCurrentSection("elections")
                handleViewElections()
              }}
            >
              Available Elections
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a
              href="#"
              className={`sidebar-nav-link ${currentSection === "vote" ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault()
                setCurrentSection("vote")
              }}
            >
              Cast Vote
            </a>
          </li>
        </ul>
      </div>

      <div className="dashboard-content">
        {statusMessage && (
          <div className="card mb-4" style={{ padding: "0.75rem 1.5rem" }}>
            <p style={{ margin: 0 }}>{statusMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="card text-center">
            <div className="spinner" style={{ margin: "0 auto" }}></div>
            <p>Processing your request...</p>
          </div>
        ) : currentSection === "elections" ? (
          renderElections()
        ) : (
          renderVote()
        )}
      </div>
    </div>
  )
}

export default VoterDashboard

