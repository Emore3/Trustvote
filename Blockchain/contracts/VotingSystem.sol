// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract VotingSystem is AccessControlEnumerable {
    // Define roles using keccak256 hash identifiers.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");

    uint256 public electionCount;

    // A Candidate has a name and a vote count.
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    // An Office represents a position (e.g., President, Vice-President) and has its own list of candidates.
    struct Office {
        string name;
        Candidate[] candidates;
    }

    // An Election stores its name, status, start and end times, list of offices, and tracks per-office voting.
    struct Election {
        string name;
        bool active;
        uint256 startTime;
        uint256 endTime;
        Office[] offices;
        // Mapping: voter address => (office index => voted status)
        mapping(address => mapping(uint256 => bool)) hasVotedOffice;
    }

    // Mapping from election ID to Election.
    mapping(uint256 => Election) private elections;

    // Events to emit state changes.
    event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    event ElectionUpdated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    event ElectionDeleted(uint256 indexed electionId);
    event OfficeAdded(uint256 indexed electionId, uint256 officeIndex, string officeName);
    event CandidateAdded(uint256 indexed electionId, uint256 officeIndex, uint256 candidateIndex, string candidateName);
    event VoteCast(uint256 indexed electionId, uint256 officeIndex, uint256 candidateIndex, address voter);
    
    // Admin and voter role events
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event VoterRegistered(address indexed voter);
    event VoterRemoved(address indexed voter);

    constructor() {
        // Set up the deployer as the default admin.
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        // Automatically grant ADMIN_ROLE to the specified address.
        _setupRole(ADMIN_ROLE, 0xdfce2C97ffDA046e51520Fd012a87F6Fa8b4E876);
        // Set the admin role for ADMIN_ROLE and VOTER_ROLE to be ADMIN_ROLE.
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(VOTER_ROLE, ADMIN_ROLE);
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

    // ------------------------------
    // Admin CRUD Operations
    // ------------------------------

    /// @notice Admin function to add a new admin.
    /// @param newAdmin The address to be granted the admin role.
    function addAdmin(address newAdmin) external onlyAdmin {
        grantRole(ADMIN_ROLE, newAdmin);
        emit AdminAdded(newAdmin);
    }

    /// @notice Admin function to remove an admin.
    /// @param adminToRemove The address to be revoked of the admin role.
    function removeAdmin(address adminToRemove) external onlyAdmin {
        revokeRole(ADMIN_ROLE, adminToRemove);
        emit AdminRemoved(adminToRemove);
    }

    /// @notice Returns a list of all admin addresses.
    function viewAdmins() external view returns (address[] memory) {
        uint256 count = getRoleMemberCount(ADMIN_ROLE);
        address[] memory admins = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            admins[i] = getRoleMember(ADMIN_ROLE, i);
        }
        return admins;
    }

    /// @notice Updates an admin by revoking the role from the old address and granting it to the new address.
    /// @param oldAdmin The current admin address.
    /// @param newAdmin The new admin address.
    function updateAdmin(address oldAdmin, address newAdmin) external onlyAdmin {
        revokeRole(ADMIN_ROLE, oldAdmin);
        grantRole(ADMIN_ROLE, newAdmin);
        emit AdminRemoved(oldAdmin);
        emit AdminAdded(newAdmin);
    }

    // ------------------------------
    // Voter CRUD Operations
    // ------------------------------

    /// @notice Admin function to register a voter.
    /// @param voter The address to be registered as a voter.
    function registerVoter(address voter) external onlyAdmin {
        grantRole(VOTER_ROLE, voter);
        emit VoterRegistered(voter);
    }

    /// @notice Admin function to remove a voter.
    /// @param voter The address to be removed as a voter.
    function removeVoter(address voter) external onlyAdmin {
        revokeRole(VOTER_ROLE, voter);
        emit VoterRemoved(voter);
    }

    /// @notice Returns a list of all voter addresses.
    function viewVoters() external view returns (address[] memory) {
        uint256 count = getRoleMemberCount(VOTER_ROLE);
        address[] memory voters = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            voters[i] = getRoleMember(VOTER_ROLE, i);
        }
        return voters;
    }

    /// @notice Updates a voter by revoking the role from the old address and granting it to the new address.
    /// @param oldVoter The current voter address.
    /// @param newVoter The new voter address.
    function updateVoter(address oldVoter, address newVoter) external onlyAdmin {
        revokeRole(VOTER_ROLE, oldVoter);
        grantRole(VOTER_ROLE, newVoter);
        emit VoterRemoved(oldVoter);
        emit VoterRegistered(newVoter);
    }

    // ------------------------------
    // Election, Office, Candidate CRUD (Examples)
    // ------------------------------

    /// @notice Admin function to create a new election with a start and end time.
    /// @param _name The name of the election.
    /// @param _startTime The UNIX timestamp when the election begins.
    /// @param _endTime The UNIX timestamp when the election ends.
    function createElection(string memory _name, uint256 _startTime, uint256 _endTime) external onlyAdmin {
        require(_endTime > _startTime, "End time must be after start time");
        electionCount++;
        Election storage newElection = elections[electionCount];
        newElection.name = _name;
        newElection.active = true;
        newElection.startTime = _startTime;
        newElection.endTime = _endTime;
        emit ElectionCreated(electionCount, _name, _startTime, _endTime);
    }

    /// @notice Admin function to update an existing election's details.
    /// @param electionId The ID of the election.
    /// @param _name The new name of the election.
    /// @param _startTime The new start time.
    /// @param _endTime The new end time.
    function updateElection(uint256 electionId, string memory _name, uint256 _startTime, uint256 _endTime) external onlyAdmin {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        require(_endTime > _startTime, "End time must be after start time");
        Election storage election = elections[electionId];
        election.name = _name;
        election.startTime = _startTime;
        election.endTime = _endTime;
        emit ElectionUpdated(electionId, _name, _startTime, _endTime);
    }

    /// @notice Admin function to "delete" an election by marking it inactive.
    /// @param electionId The ID of the election.
    function deleteElection(uint256 electionId) external onlyAdmin {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is already inactive");
        election.active = false;
        emit ElectionDeleted(electionId);
    }

    /// @notice Admin function to end an election.
    /// @param electionId The ID of the election.
    function endElection(uint256 electionId) external onlyAdmin {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is already ended");
        election.active = false;
    }

    /// @notice Admin function to add an office to an election.
    /// @param electionId The ID of the election.
    /// @param officeName The name of the office (e.g., "President").
    function addOffice(uint256 electionId, string memory officeName) external onlyAdmin {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is not active");
        election.offices.push();
        uint256 officeIndex = election.offices.length - 1;
        election.offices[officeIndex].name = officeName;
        emit OfficeAdded(electionId, officeIndex, officeName);
    }

    /// @notice Admin function to add a candidate to a specific office in an election.
    /// @param electionId The ID of the election.
    /// @param officeIndex The index of the office within the election.
    /// @param candidateName The name of the candidate.
    function addCandidate(uint256 electionId, uint256 officeIndex, string memory candidateName) external onlyAdmin {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is not active");
        require(officeIndex < election.offices.length, "Invalid office index");
        Office storage office = election.offices[officeIndex];
        office.candidates.push(Candidate(candidateName, 0));
        uint256 candidateIndex = office.candidates.length - 1;
        emit CandidateAdded(electionId, officeIndex, candidateIndex, candidateName);
    }

    /// @notice Voter function to cast a vote for a candidate in a specific office of an election.
    /// @param electionId The ID of the election.
    /// @param officeIndex The index of the office.
    /// @param candidateIndex The index of the candidate in that office.
    function vote(uint256 electionId, uint256 officeIndex, uint256 candidateIndex) external onlyVoter {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(election.active, "Election is not active");
        require(block.timestamp >= election.startTime, "Election has not started yet");
        require(block.timestamp <= election.endTime, "Election has ended");
        require(officeIndex < election.offices.length, "Invalid office index");
        Office storage office = election.offices[officeIndex];
        require(candidateIndex < office.candidates.length, "Invalid candidate index");
        require(!election.hasVotedOffice[msg.sender][officeIndex], "Voter has already voted for this office");

        office.candidates[candidateIndex].voteCount++;
        election.hasVotedOffice[msg.sender][officeIndex] = true;
        emit VoteCast(electionId, officeIndex, candidateIndex, msg.sender);
    }

    /// @notice Returns details of a candidate in a specific office.
    /// @param electionId The ID of the election.
    /// @param officeIndex The index of the office.
    /// @param candidateIndex The index of the candidate.
    /// @return name The candidate's name.
    /// @return voteCount The candidate's vote count.
    function getCandidate(uint256 electionId, uint256 officeIndex, uint256 candidateIndex) external view returns (string memory name, uint256 voteCount) {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(officeIndex < election.offices.length, "Invalid office index");
        Office storage office = election.offices[officeIndex];
        require(candidateIndex < office.candidates.length, "Invalid candidate index");
        Candidate storage candidate = office.candidates[candidateIndex];
        return (candidate.name, candidate.voteCount);
    }

    /// @notice Returns the list of candidates for a specific office in an election.
    /// @param electionId The ID of the election.
    /// @param officeIndex The index of the office.
    /// @return An array of Candidate structs.
    function getCandidates(uint256 electionId, uint256 officeIndex) external view returns (Candidate[] memory) {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        require(officeIndex < election.offices.length, "Invalid office index");
        Office storage office = election.offices[officeIndex];
        uint256 candidateCount = office.candidates.length;
        Candidate[] memory candidateList = new Candidate[](candidateCount);
        for (uint256 i = 0; i < candidateCount; i++) {
            candidateList[i] = office.candidates[i];
        }
        return candidateList;
    }

    /// @notice Returns the details of an election.
    /// @param electionId The ID of the election.
    /// @return name The election's name.
    /// @return active Whether the election is active.
    /// @return startTime The start time of the election.
    /// @return endTime The end time of the election.
    /// @return officeCount The number of offices in the election.
    function getElectionDetails(uint256 electionId) external view returns (string memory name, bool active, uint256 startTime, uint256 endTime, uint256 officeCount) {
        require(electionId > 0 && electionId <= electionCount, "Invalid election id");
        Election storage election = elections[electionId];
        return (election.name, election.active, election.startTime, election.endTime, election.offices.length);
    }
}
