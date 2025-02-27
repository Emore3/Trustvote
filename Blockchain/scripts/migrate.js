// migrate.js

// The Purpose of this script is to move the funds in the old contract address over to a new contract address. so you don't waste
// test ether
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Replace with your old contract address
  const oldContractAddress = process.env.OLD_CONTRACT_ADDRESS;
  // Replace with your new contract address
  const newContractAddress = process.env.NEW_CONTRACT_ADDRESS;

  // Get the contract instance for the old contract (make sure the ABI includes migrateFundsAndDestroy)
  const OldContract = await ethers.getContractFactory("VotingSystem");
  const oldContract = OldContract.attach(oldContractAddress);

  // Get an admin signer (the one that has ADMIN_ROLE)
  const [adminSigner] = await ethers.getSigners();

  console.log("Migrating funds from old contract to new contract...");

  // Call the migration function
  const tx = await oldContract.connect(adminSigner).migrateFundsAndDestroy(newContractAddress);
  await tx.wait();

  console.log("Migration complete. Old contract destroyed and funds transferred to new contract.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
