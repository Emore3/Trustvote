"use client"

import { Link, useLocation } from "react-router-dom"
import { useWeb3Auth } from "../Web3AuthContext"
import ThemeToggle from "./ThemeToggle"
import { useState, useEffect } from "react"
import { ethers, BrowserProvider } from "ethers"
import { keccak256, toUtf8Bytes } from "ethers"
import contractABI from "../abis/VotingSystem.json"

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS
const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"))

function Navbar() {
  const location = useLocation()
  const { loggedIn, logout, provider } = useWeb3Auth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (provider && loggedIn) {
        try {
          const ethersProvider = new BrowserProvider(provider, 11155111)
          ethersProvider.skipFetchAccounts = true
          const accounts = await ethersProvider.send("eth_accounts", [])

          if (accounts.length) {
            const contractRead = new ethers.Contract(contractAddress, contractABI.abi, ethersProvider)
            const adminStatus = await contractRead.hasRole(ADMIN_ROLE, accounts[0])
            setIsAdmin(adminStatus)
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [provider, loggedIn])

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
        {isAdmin && (
          <Link to="/admin" className={isActive("/admin")}>
            Admin
          </Link>
        )}
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

