// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @notice Minimal interface to check roles in the VotingSystem.
interface IVotingSystem {
    function hasRole(bytes32 role, address account) external view returns (bool);
}

contract FundingSystem {
    uint256 public constant FUND_AMOUNT = 0.05 ether;
    uint256 public constant COOLDOWN = 1 days;
    
    // Reference to the VotingSystem contract for role verification.
    IVotingSystem public votingSystem;

    // The dedicated funding account allowed to call claimFunds.
    address public fundingAccount;
    
    // Tracks the last claim time for each recipient.
    mapping(address => uint256) public lastClaimTime;
    
    // Role identifiers (must match those in VotingSystem).
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    event FundsClaimed(address indexed recipient, uint256 amount);
    event FundsWithdrawn(address indexed admin, uint256 amount);
    
    /// @notice Sets up the FundingSystem contract.
    /// @param _votingSystem The address of the VotingSystem contract.
    /// @param _fundingAccount The dedicated account allowed to trigger funding.
    constructor(address _votingSystem, address _fundingAccount) {
        votingSystem = IVotingSystem(_votingSystem);
        fundingAccount = _fundingAccount;
    }
    
    /// @notice Allows the designated funding account to transfer funds to a recipient.
    /// @param _recipient The address to receive the funds.
    function claimFunds(address _recipient) external {
        // Ensure that only the designated funding account can trigger this function.
        require(msg.sender == fundingAccount, "Unauthorized caller");
        
        // Verify that the recipient is registered as a voter or admin.
        require(
            votingSystem.hasRole(VOTER_ROLE, _recipient) || votingSystem.hasRole(ADMIN_ROLE, _recipient),
            "Recipient is not registered as voter or admin"
        );
        
        // Enforce the cooldown period for the recipient.
        require(block.timestamp >= lastClaimTime[_recipient] + COOLDOWN, "Cooldown not expired");
        
        // Check that the contract has enough funds.
        require(address(this).balance >= FUND_AMOUNT, "Insufficient funds");

        // Update the last claim time and transfer funds.
        lastClaimTime[_recipient] = block.timestamp;
        payable(_recipient).transfer(FUND_AMOUNT);
        emit FundsClaimed(_recipient, FUND_AMOUNT);
    }
    
    /// @notice Allows an admin (verified via VotingSystem) to withdraw a specified amount.
    /// @param amount The amount of funds to withdraw.
    function withdrawFunds(uint256 amount) external {
        require(votingSystem.hasRole(ADMIN_ROLE, msg.sender), "Only admin can withdraw funds");
        require(amount <= address(this).balance, "Insufficient contract balance");
        payable(msg.sender).transfer(amount);
        emit FundsWithdrawn(msg.sender, amount);
    }
    
    // Allow the contract to receive Ether.
    receive() external payable {}
}
