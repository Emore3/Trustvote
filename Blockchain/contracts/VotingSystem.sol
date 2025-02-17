// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract VotingSystem is AccessControl {
    // Define roles using keccak256 hash identifiers.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");

    uint256 public electionCount;

    // A Candidate has a name and a vote count.
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    // An Election stores its name, status, list of candidates,
    // and a mapping to track if an address has already voted.
    struct Election {
        string name;
        bool active;
        Candidate[] candidates;
        mapping(address => bool) hasVoted;
    }

    // Mapping from election ID to Election.
    mapping(uint256 => Election) private elections;

    // Events to emit state changes.
    event ElectionCreated(uint256 indexed electionId, string name);
    event CandidateAdded(uint256 indexed electionId, uint256 candidateIndex, string candidateName);
    event VoteCast(uint256 indexed electionId, uint256 candidateIndex, address voter);

    constructor() {
        // Set up the deployer as the default admin.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /// @notice Modifier to restrict function to admin addresses.
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can call this");
        _;
    }

    /// @notice Modifier to restrict function to registered voters.
    modifier onlyVoter() {
        require(hasRole(VOTER_ROLE, msg.sender), "Only voter can call this");
        _;
    }

    /// @notice Admin function to register a voter.
    /// @param voter The address to be registered as a voter.
    function registerVoter(address voter) external onlyAdmin {
        grantRole(VOTER_ROLE, voter);
    }

    /// @notice Admin function to create a new election.
    /// @param _name The name of the election.
    function createElection(string memory _name) external onlyAdmin {
        electionCount++;
        Election storage newElection = elections[electionCount];
        newElection.name = _name;
        newElection.active = true;
        emit ElectionCreated(electionCount, _name);
    }

    /// @notice Admin function to add a candidate to an election.
    /// @param electionId The ID of the election.
    /// @param candidateName The name of the candidate.
    function addCandidate(uint256 electionId, string memory candidateName) external onlyAdmin {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is not active");
        election.candidates.push(Candidate(candidateName, 0));
        uint256 candidateIndex = election.candidates.length - 1;
        emit CandidateAdded(electionId, candidateIndex, candidateName);
    }

    /// @notice Voter function to cast a vote for a candidate in an election.
    /// @param electionId The ID of the election.
    /// @param candidateIndex The index of the candidate in the election's candidate list.
    function vote(uint256 electionId, uint256 candidateIndex) external onlyVoter {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is not active");
        require(!election.hasVoted[msg.sender], "Voter has already voted in this election");
        require(candidateIndex < election.candidates.length, "Invalid candidate index");

        election.candidates[candidateIndex].voteCount++;
        election.hasVoted[msg.sender] = true;
        emit VoteCast(electionId, candidateIndex, msg.sender);
    }

    /// @notice Admin function to end an election.
    /// @param electionId The ID of the election.
    function endElection(uint256 electionId) external onlyAdmin {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is already ended");
        election.active = false;
    }

    /// @notice Returns a candidate’s details for a given election.
    /// @param electionId The ID of the election.
    /// @param candidateIndex The index of the candidate.
    /// @return name The candidate’s name.
    /// @return voteCount The candidate’s vote count.
    function getCandidate(uint256 electionId, uint256 candidateIndex) external view returns (string memory name, uint256 voteCount) {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(candidateIndex < election.candidates.length, "Invalid candidate index");
        Candidate storage candidate = election.candidates[candidateIndex];
        return (candidate.name, candidate.voteCount);
    }

    /// @notice Returns the list of candidates for a given election.
    /// @param electionId The ID of the election.
    /// @return An array of Candidate structs.
    function getCandidates(uint256 electionId) external view returns (Candidate[] memory) {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        uint256 candidateLength = election.candidates.length;
        Candidate[] memory candidates = new Candidate[](candidateLength);
        for (uint256 i = 0; i < candidateLength; i++) {
            candidates[i] = election.candidates[i];
        }
        return candidates;
    }

    function getElectionDetails(uint256 electionId) external view returns (string memory name, bool active, uint256 candidateCount) {
    require(electionId > 0 && electionId <= electionCount, "Invalid election id");
    Election storage election = elections[electionId];
    return (election.name, election.active, election.candidates.length);
    }

}
