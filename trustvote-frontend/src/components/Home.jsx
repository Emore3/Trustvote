import { useWeb3Auth } from "../Web3AuthContext"
import { Link } from "react-router-dom"

function Home() {
  const { loggedIn, login } = useWeb3Auth()
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS

  return (
    <div className="container">
      <section className="hero">
        <h1>Welcome to Trustvote</h1>
        <p>
          TrustVote leverages blockchain technology to provide a transparent, secure, and tamper-proof voting
          experience. Cast your vote with confidence knowing that your voice matters and is protected.
        </p>

        {loggedIn ? (
          <div className="hero-buttons">
            <Link to="/voter" className="btn-primary">
              Cast Your Vote
            </Link>
            <Link to="/results" className="btn-secondary">
              View Results
            </Link>
          </div>
        ) : (
          <div className="hero-buttons">
            <button onClick={login} className="btn-primary">
              Get Started
            </button>
          </div>
        )}
      </section>

      <section className="container">
        <div className="card">
          <h2>Why Choose TrustVote?</h2>
          <div className="flex" style={{ gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>
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
                  style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Security
              </h3>
              <p>
                Our blockchain-based voting system ensures that votes are immutable and tamper-proof. Each vote is
                securely recorded on the blockchain, providing a transparent and verifiable record.
              </p>
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>
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
                  style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Transparency
              </h3>
              <p>
                All voting data is publicly verifiable while maintaining voter privacy. Anyone can audit the election
                results without compromising individual votes.
              </p>
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>
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
                  style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                Accessibility
              </h3>
              <p>
                Vote from anywhere with an internet connection. Our platform is designed to be user-friendly and
                accessible to all eligible voters.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="card">
          <h2>Smart Contract Transparency</h2>
          <div className="flex" style={{ gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>
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
                  style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Audit Our Contract
              </h3>
              <p>
                At TrustVote, we believe in complete transparency. Our voting system is powered by a smart contract
                deployed on the Ethereum blockchain that anyone can audit and verify.
              </p>
              <p>
                The smart contract code is open source and has undergone rigorous security audits to ensure the
                integrity of the voting process. You can inspect the contract yourself to verify its security and
                functionality.
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <a
                  href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  View Contract on Etherscan
                </a>
              </div>
            </div>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <h3>
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
                  style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
                >
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                Verified & Secure
              </h3>
              <p>
                Our smart contract has been verified on Etherscan, allowing anyone to review the exact code that powers
                the voting system. This verification ensures that the deployed contract matches the published source
                code.
              </p>
              <p>
                The contract implements role-based access control, secure voting mechanisms, and transparent tallying to
                ensure that every vote is counted correctly and that the election results are accurate.
              </p>
              <p>
                By leveraging the immutability of blockchain technology, we provide a voting system that cannot be
                tampered with once deployed, ensuring the integrity of every election.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

