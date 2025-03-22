"use client"

import { useState, useEffect, useRef } from "react"
import { ethers, BrowserProvider } from "ethers"
import contractABI from "../abis/VotingSystem.json"
import { useWeb3Auth } from "../Web3AuthContext"

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS

function ElectionResults() {
  const { provider, loggedIn } = useWeb3Auth()
  const [account, setAccount] = useState(null)
  const [votingContractRead, setVotingContractRead] = useState(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [electionsList, setElectionsList] = useState([])
  const [selectedElectionId, setSelectedElectionId] = useState(null)
  const [selectedElectionDetails, setSelectedElectionDetails] = useState(null)
  const [officeResults, setOfficeResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Ref for results container to scroll to
  const resultsRef = useRef(null)

  // ----------------- Initialization -----------------
  useEffect(() => {
    const init = async () => {
      if (provider) {
        try {
          setLoading(true)
          const ethersProvider = new BrowserProvider(provider, 11155111)
          ethersProvider.skipFetchAccounts = true
          const accounts = await ethersProvider.send("eth_accounts", [])
          if (accounts.length) {
            setAccount(accounts[0])
            const contractRead = new ethers.Contract(contractAddress, contractABI.abi, ethersProvider)
            setVotingContractRead(contractRead)

            // // Load initial data
            // handleViewElections()
          }
        } catch (error) {
          console.error("Error initializing election results page:", error)
          setStatusMessage("Error initializing page")
        } finally {
          setLoading(false)
        }
      }
    }
    init()
  }, [provider])

  useEffect(() => {
    if (votingContractRead) {
      handleViewElections();
    }
  }, [votingContractRead]);

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
    try {
      setLoading(true)
      setSelectedElectionId(election.id)
      setSelectedElectionDetails(election)
  
      // Query the OfficeAdded events for the selected election.
      const officeAddedFilter = votingContractRead.filters.OfficeAdded(election.id)
      const officeAddedEvents = await votingContractRead.queryFilter(officeAddedFilter)
      
      // Build a mapping from office index to office name.
      const officeNameMap = {}
      officeAddedEvents.forEach((event) => {
        const index = Number(event.args.officeIndex)
        officeNameMap[index] = event.args.officeName
      })
  
      const offices = []
      // Loop through each office for the election (from 0 to officeCount-1)
      for (let i = 0; i < election.officeCount; i++) {
        const candidates = await votingContractRead.getCandidates(election.id, i)
        // Convert returned candidate objects to plain JS objects.
        const candidateResults = candidates.map((c) => ({
          name: c.name,
          voteCount: Number(c.voteCount),
        }))
  
        // Calculate total votes for this office.
        const totalVotes = candidateResults.reduce((sum, c) => sum + c.voteCount, 0)
  
        // Add percentage to each candidate.
        const candidatesWithPercentage = candidateResults.map((c) => ({
          ...c,
          percentage: totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100) : 0,
        }))
  
        // Sort candidates by vote count (descending).
        candidatesWithPercentage.sort((a, b) => b.voteCount - a.voteCount)
  
        offices.push({
          officeIndex: i,
          // Use the queried office name or fallback to a placeholder.
          officeName: officeNameMap[i] || `Office ${i + 1}`,
          candidates: candidatesWithPercentage,
          totalVotes,
        })
      }
      setOfficeResults(offices)
      setStatusMessage(`Results for election ${election.id} loaded`)

      // Scroll to results after they're loaded
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
    } catch (error) {
      console.error(error)
      setStatusMessage("Error loading election results")
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <div className="container">
      <h1>Election Results</h1>
      {statusMessage && (
        <div className="card mb-4" style={{ padding: "0.75rem 1.5rem" }}>
          <p style={{ margin: 0 }}>{statusMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center">
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p>Loading results...</p>
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <h2>Select an Election</h2>
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
                        {election.active && Date.now() / 1000 <= election.endTime ? "Active" : "Ended"}
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
                      <button onClick={() => handleSelectElection(election)}>View Results</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No elections found.</p>
            )}
          </div>

          {selectedElectionId && (
            <div className="results-container fade-in" ref={resultsRef}>
              <div className="card">
                <h2>Results: {selectedElectionDetails.name}</h2>
                <p>
                  Election {selectedElectionDetails.active && Date.now() / 1000 <= selectedElectionDetails.endTime ? "is active" : "has ended"} •
                  {selectedElectionDetails.active && Date.now() / 1000 <= selectedElectionDetails.endTime
                    ? " Results are preliminary"
                    : " Final results"}
                </p>

                {officeResults.length > 0 ? (
                  officeResults.map((office, idx) => (
                    <div key={idx} className="office-results">
                      <h3>{office.officeName}</h3>
                      <p>Total votes: {office.totalVotes}</p>

                      {office.candidates.length > 0 ? (
                        office.candidates.map((candidate, i) => (
                          <div key={i} className="mb-4">
                            <div className="candidate-info">
                              <span className="candidate-name">{candidate.name}</span>
                              <span className="candidate-votes">
                                {candidate.voteCount} votes ({candidate.percentage}%)
                              </span>
                            </div>
                            <div
                              className="candidate-bar"
                              style={{
                                width: `${candidate.percentage}%`,
                                minWidth: "2%",
                                backgroundColor: i === 0 ? "var(--primary)" : "var(--secondary)",
                              }}
                            ></div>
                          </div>
                        ))
                      ) : (
                        <p>No candidates found for this office.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No office results available.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ElectionResults

