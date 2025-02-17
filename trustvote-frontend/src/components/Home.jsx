import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import contractABI from "../abis/VotingSystem.json";

// Replace with your deployed contract address
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

function Home() {
  const [account, setAccount] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      provider.listAccounts().then((accounts) => {
        if (accounts.length) {
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      setAccount(accounts[0]);
      setStatusMessage("Wallet connected!");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error connecting wallet");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to the Blockchain Voting System</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>
          Connected as: <strong>{account?.address}</strong>
        </p>
      )}
      {statusMessage && <p>{statusMessage}</p>}
      <p>
        Use the navigation bar to access the Admin Dashboard, Voter Dashboard, and view Election Results.
      </p>
    </div>
  );
}

export default Home;
