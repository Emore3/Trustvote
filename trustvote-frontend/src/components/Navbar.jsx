import { Link, useLocation } from "react-router-dom"
import { useWeb3Auth } from "../Web3AuthContext"
import ThemeToggle from "./ThemeToggle"

function Navbar() {
  const location = useLocation()
  const { loggedIn, logout } = useWeb3Auth()

  const isActive = (path) => {
    return location.pathname === path ? "navbar-link active" : "navbar-link"
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
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
          <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-3.08"></path>
          <path d="M18 14v4h4"></path>
          <path d="M18 22l-3-3 3-3"></path>
          <path d="M9 9h1"></path>
          <path d="M9 13h1"></path>
          <path d="M9 17h1"></path>
        </svg>
        <span>TrustVote</span>
      </div>

      <div className="navbar-nav">
        <Link to="/" className={isActive("/")}>
          Home
        </Link>
        <Link to="/admin" className={isActive("/admin")}>
          Admin
        </Link>
        <Link to="/voter" className={isActive("/voter")}>
          Vote
        </Link>
        <Link to="/results" className={isActive("/results")}>
          Results
        </Link>
        <ThemeToggle />
        {loggedIn && (
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar

