require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  // // Path to your .env file (or a separate config file)
  // const envPath = path.resolve(__dirname, "../.env");
  // const envConfig = fs.readFileSync(envPath, "utf8");
  
  // // Parse current environment variables (for simplicity, we'll do basic parsing)
  // // In practice, you might want to use a package like dotenv-parse-variables
  // const lines = envConfig.split("\n");
  // let oldAddress = "";
  // let newAddress = "";
  // lines.forEach((line) => {
  //   if (line.startsWith("OLD_CONTRACT_ADDRESS=")) {
  //     oldAddress = line.split("=")[1].trim();
  //   }
  //   if (line.startsWith("NEW_CONTRACT_ADDRESS=")) {
  //     newAddress = line.split("=")[1].trim();
  //   }
  // });

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);
  
  // Deploy your new contract
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy();
  await votingSystem.waitForDeployment();

  const deployedAddress = await votingSystem.getAddress();
  console.log("VotingSystem deployed to:", deployedAddress);

  
  // // Update the .env file: move current NEW to OLD, set deployedAddress as NEW
  // const updatedEnvConfig = lines.map((line) => {
  //   if (line.startsWith("OLD_CONTRACT_ADDRESS=")) {
  //     return `OLD_CONTRACT_ADDRESS=${newAddress}`; // new becomes old
  //   }
  //   if (line.startsWith("NEW_CONTRACT_ADDRESS=")) {
  //     return `NEW_CONTRACT_ADDRESS=${deployedAddress}`;
  //   }
  //   return line;
  // }).join("\n");
  
  // fs.writeFileSync(envPath, updatedEnvConfig);
  // console.log("Updated .env file with new addresses.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
