const { ethers } = require("hardhat");
const { expect } = require("chai");
require("@nomicfoundation/hardhat-chai-matchers");

describe("VotingSystem", function () {
  let votingSystem;
  let owner, voter1, voter2, other;

  beforeEach(async function () {
    [owner, voter1, voter2, other] = await ethers.getSigners();
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    votingSystem = await VotingSystem.deploy();

    // Register voters using the admin (owner) account.
    await votingSystem.registerVoter(voter1.address);
    await votingSystem.registerVoter(voter2.address);
  });

  it("allows admin to create an election and add candidates", async function () {
    await votingSystem.createElection("Test Election");
    // Election id will be 1.
    await votingSystem.addCandidate(1, "Candidate A");
    await votingSystem.addCandidate(1, "Candidate B");

    const candidateA = await votingSystem.getCandidate(1, 0);
    expect(candidateA[0]).to.equal("Candidate A");
    expect(candidateA[1].toString()).to.equal("0");

    const candidateB = await votingSystem.getCandidate(1, 1);
    expect(candidateB[0]).to.equal("Candidate B");
    expect(candidateB[1].toString()).to.equal("0");
  });

  it("allows registered voters to cast a vote", async function () {
    await votingSystem.createElection("Test Election");
    await votingSystem.addCandidate(1, "Candidate A");
    await votingSystem.addCandidate(1, "Candidate B");

    // Voter1 casts vote for Candidate A (index 0)
    await votingSystem.connect(voter1).vote(1, 0);
    const candidateA = await votingSystem.getCandidate(1, 0);
    expect(candidateA[1].toString()).to.equal("1");

    // Voter1 cannot vote again in the same election.
    await expect(votingSystem.connect(voter1).vote(1, 1))
      .to.be.revertedWith("Voter has already voted in this election");
  });

  it("prevents non-registered voters from voting", async function () {
    await votingSystem.createElection("Test Election");
    await votingSystem.addCandidate(1, "Candidate A");

    await expect(votingSystem.connect(other).vote(1, 0))
      .to.be.revertedWith("Only voter can call this");
  });
});
