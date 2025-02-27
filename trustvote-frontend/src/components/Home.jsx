import React from "react";
import { useWeb3Auth } from "../Web3AuthContext";

function Home() {
  const { provider, loggedIn, login, logout } = useWeb3Auth();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome to the Blockchain Voting System</h1>
      {loggedIn ? (
        <>
          <p>
            Connected! You can now access the Admin Dashboard, Voter Dashboard, and view Election Results.
          </p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login with Web3Auth</button>
      )}
    </div>
  );
}

export default Home;
