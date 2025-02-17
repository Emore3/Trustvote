async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with the account:", deployer.address);
  
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    const votingSystem = await VotingSystem.deploy();
    await votingSystem.waitForDeployment();

    const address = await votingSystem.getAddress();
    console.log("VotingSystem deployed to:", address);
  }
  
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
  