const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const WalletModel = require("../models/wallet");
const { sendFunds, registerVoter } = require("../services/ethersService");

router.post("/login", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    // Validate the wallet address.
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    
    // Check if the wallet is already registered.
    const existingWallet = await WalletModel.findOne({ address: walletAddress });
    if (!existingWallet) {
      // Store the new wallet in the database.
      await WalletModel.create({ address: walletAddress });

      // Call the VotingSystem contract to register the voter.
      const regTx = await registerVoter(walletAddress);
      console.log(`Registered voter: ${walletAddress} via tx: ${regTx.hash}`);

      // return res.status(200).json({ message: "Wallet already registered" });
    }
  
    // Send Ether to the new wallet.
    const fundTx = await sendFunds(walletAddress);
    console.log(`Sent funds to ${walletAddress}: ${fundTx.hash}`);

    res.status(200).json({ message: "Wallet registered, funded, and voter registered successfully." });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
