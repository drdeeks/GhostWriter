// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LiquidityPool
 * @dev Collects and manages fees from Ghost Writer game
 * All fees (100%) flow to this pool for future token liquidity
 */
contract LiquidityPool is Ownable, ReentrancyGuard {
    // Address authorized to deposit (StoryManager)
    address public storyManager;

    // Events
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event StoryManagerUpdated(address indexed newManager);

    modifier onlyStoryManager() {
        require(
            msg.sender == storyManager,
            "Only StoryManager can deposit"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Set the StoryManager contract address (only owner)
     */
    function setStoryManager(address _storyManager) external onlyOwner {
        require(_storyManager != address(0), "Invalid address");
        storyManager = _storyManager;
        emit StoryManagerUpdated(_storyManager);
    }

    /**
     * @dev Deposit fees (only callable by StoryManager)
     */
    function deposit() external payable onlyStoryManager nonReentrant {
        require(msg.value > 0, "Must deposit positive amount");
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw funds (only owner)
     * In production, this would be governed by DAO/multisig
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(amount <= address(this).balance, "Insufficient balance");

        // Bug #35 fix: Use call instead of transfer
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(owner(), amount);
    }

    /**
     * @dev Withdraw all funds (only owner)
     */
    function withdrawAll() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");

        // Bug #35 fix: Use call instead of transfer
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");

        emit Withdrawn(owner(), balance);
    }

    /**
     * @dev Get current pool balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get total collected (same as balance)
     */
    function totalCollected() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        require(msg.sender == storyManager, "Only StoryManager can send");
        emit Deposited(msg.sender, msg.value);
    }
}
