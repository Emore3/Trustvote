const { ethers } = require("ethers");
require("dotenv").config();

// Set up provider and funding wallet using environment variables.
console.log(process.env.RPC_URL)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const fundingWallet = new ethers.Wallet(process.env.FUNDING_WALLET_PRIVATE_KEY, provider);

// VotingSystem contract setup
const votingSystemAddress = process.env.VOTING_SYSTEM_ADDRESS;
const votingSystemAbi = [
  // Minimal ABI including only the function needed.
  "function registerVoter(address voter) external"
];
const votingSystemContract = new ethers.Contract(votingSystemAddress, votingSystemAbi, fundingWallet);

// Define the fund amount (0.05 ether)
const FUND_AMOUNT = ethers.parseEther("0.05");

/**
 * Sends funds to the specified wallet address.
 * @param {string} walletAddress The recipient wallet address.
 */
async function sendFunds(walletAddress) {
  const tx = await fundingWallet.sendTransaction({
    to: walletAddress,
    value: FUND_AMOUNT
  });
  await tx.wait();
  return tx;
}

/**
 * Registers the voter by calling the VotingSystem contract.
 * @param {string} walletAddress The wallet address to register.
 */
async function registerVoter(walletAddress) {
  const tx = await votingSystemContract.registerVoter(walletAddress);
  await tx.wait();
  return tx;
}

module.exports = {
  sendFunds,
  registerVoter,
};
