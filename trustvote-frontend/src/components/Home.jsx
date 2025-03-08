import { useWeb3Auth } from "../Web3AuthContext"
import { Link } from "react-router-dom"

function Home() {
  const { loggedIn, login } = useWeb3Auth()

  return (
    <div className="container">
      <section className="hero">
        <h1>Secure Blockchain Voting System</h1>
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
              Connect Wallet
            </button>
            <Link to="/results" className="btn-secondary">
              View Results
            </Link>
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
    </div>
  )
}

export default Home

