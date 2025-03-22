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
  const { loggedIn, logout, provider, web3auth , login} = useWeb3Auth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [walletAddress, setWalletAddress] = useState("")
  const [walletBalance, setWalletBalance] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (provider && loggedIn) {
        try {
          const ethersProvider = new BrowserProvider(provider, 11155111)
          ethersProvider.skipFetchAccounts = true
          const accounts = await ethersProvider.send("eth_accounts", [])

          if (accounts.length) {
            setWalletAddress(accounts[0])

            // Get wallet balance
            const balance = await ethersProvider.getBalance(accounts[0])
            setWalletBalance(ethers.formatEther(balance))

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

    const getUserInfo = async () => {
      if (web3auth && loggedIn) {
        try {
          const info = await web3auth.getUserInfo()
          setUserInfo(info)
        } catch (error) {
          console.error("Error getting user info:", error)
        }
      }
    }

    checkAdminStatus()
    getUserInfo()
  }, [provider, loggedIn, web3auth])

  const isActive = (path) => {
    return location.pathname === path ? "navbar-link active" : "navbar-link"
  }

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest(".profile-dropdown-container")) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileDropdownOpen])

  // Copy wallet address to clipboard
  const copyWalletAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress)
        setCopySuccess(true)

        // Reset copy success message after 2 seconds
        setTimeout(() => {
          setCopySuccess(false)
        }, 2000)
      } catch (err) {
        console.error("Failed to copy address: ", err)
      }
    }
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

        {loggedIn ? (
          <div className="profile-dropdown-container">
            <button onClick={toggleProfileDropdown} className="profile-button" aria-label="Open profile menu">
              {userInfo?.profileImage ? (
                <img src={userInfo.profileImage || "/placeholder.svg"} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-avatar">{userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "U"}</div>
              )}
            </button>

            {profileDropdownOpen && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <div className="profile-info">
                    {userInfo?.profileImage && (
                      <img
                        src={userInfo.profileImage || "/placeholder.svg"}
                        alt="Profile"
                        className="profile-image-large"
                      />
                    )}
                    <div>
                      <h4 className="profile-name">{userInfo?.name || "User"}</h4>
                      <p className="profile-email">{userInfo?.email || "No email available"}</p>
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h5 className="profile-section-title">Wallet</h5>
                  <div className="profile-detail wallet-address-container">
                    <div className="wallet-address-label">
                      <span className="profile-label">Address:</span> 
                      <span className="profile-value wallet-address">
                        {walletAddress
                          ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                          : "Not connected"}
                      </span>
                      <button onClick={copyWalletAddress} className="copy-address-button" title="Copy full address">
                        {copySuccess ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="copy-success"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="profile-detail">
                    <span className="profile-label">Balance:</span>
                    <span className="profile-value">
                      {walletBalance ? `${Number.parseFloat(walletBalance).toFixed(4)} ETH` : "0 ETH"}
                    </span>
                  </div>
                </div>

                <div className="profile-section">
                  <h5 className="profile-section-title">Preferences</h5>
                  <div className="profile-action theme-toggle-container">
                    <span>Dark Mode</span>
                    <ThemeToggle />
                  </div>
                </div>

                <div className="profile-footer">
                  <button onClick={logout} className="logout-button">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={login} className="btn-secondary">
            Login
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar

