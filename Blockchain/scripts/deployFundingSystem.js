// scripts/deployFundingSystem.js
const hre = require("hardhat");

async function main() {
  // Retrieve the deployer account.
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Replace with your actual VotingSystem contract address.
  const votingSystemAddress = "0x04e869A1072db717B51D1E4D2C758944fB65701D";
  // Replace with the dedicated funding account address.
  const fundingAccount = "0xdfce2C97ffDA046e51520Fd012a87F6Fa8b4E876";

  // Get the FundingSystem contract factory.
  const FundingSystem = await hre.ethers.getContractFactory("FundingSystem");

  // Deploy the contract with the required constructor arguments.
  const fundingSystem = await FundingSystem.deploy(votingSystemAddress, fundingAccount);
  await fundingSystem.waitForDeployment();

  console.log("FundingSystem deployed to:", fundingSystem.address);
}

// Execute the deploy script.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
