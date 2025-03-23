import React, { createContext, useContext, useState, useEffect } from "react";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/modal";
import axios from 'axios';
import "./App.css"

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: import.meta.env.VITE_RPC_TARGET,
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

const Web3AuthContext = createContext();

export const Web3AuthProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        setProvider(web3auth.provider);
        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };
    init();
  }, []);

  const login = async () => {
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
  
      if (web3auth.connected) {
        setIsLoading(true);
        // Get wallet address
        const accounts = await web3authProvider.request({ method: 'eth_accounts' });
        const walletAddress = accounts[0];

        console.log(walletAddress)

        // const im = JSON.stringify({ "walletAddress" : walletAddress })
        // console.log(im)
        // Send wallet address to backend
        // const response = await axios.post('https://trustvote-backend.onrender.com/api/login', { walletAddress })
        // .then(response => {
        //   console.log('Login Response:', response);
        // })
        // .catch(error => {
        //   console.error('Login Error:', error);
        // });

        try{
          const response = await axios.post('https://trustvote-backend.onrender.com/api/login', { walletAddress })
          if (response){ 
            console.log(response);
            setLoggedIn(true);
          }
        } catch (error){
          console.log("Pellumi Error: ", error)
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      logout()
    } finally{
      setIsLoading(false)
    }
  };
  

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
  };

  return (
    <Web3AuthContext.Provider value={{ provider, loggedIn, login, logout, web3auth, isLoading }}>
      {isLoading ? (
        // <div className="loading-screen">
        //   <p>Loading...</p>
        // </div>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        children
      )}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => useContext(Web3AuthContext);
