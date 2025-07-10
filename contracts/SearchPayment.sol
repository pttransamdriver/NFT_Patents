// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SearchPayment
 * @dev Smart contract for handling AI search payments in ETH
 */
contract SearchPayment is Ownable, ReentrancyGuard, Pausable {
    // Events
    event PaymentReceived(
        address indexed user,
        uint256 amount,
        uint256 timestamp,
        uint256 searchCredits
    );
    
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event Withdrawal(address indexed owner, uint256 amount);

    // State variables
    uint256 public searchPrice; // Price in wei for 3 searches
    uint256 public constant SEARCHES_PER_PAYMENT = 3;
    
    // Mapping to track user payments (for reference)
    mapping(address => uint256) public userTotalPaid;
    mapping(address => uint256) public userSearchesPurchased;

    /**
     * @dev Constructor sets initial search price
     * @param _initialPrice Initial price in wei for 3 searches
     */
    constructor(uint256 _initialPrice) Ownable(msg.sender) {
        searchPrice = _initialPrice;
    }

    /**
     * @dev Pay for AI searches
     * Users send ETH to get 3 search credits
     */
    function payForSearch() external payable nonReentrant whenNotPaused {
        require(msg.value >= searchPrice, "Insufficient payment");
        
        // Track user statistics
        userTotalPaid[msg.sender] += msg.value;
        userSearchesPurchased[msg.sender] += SEARCHES_PER_PAYMENT;
        
        // Emit event for backend to process
        emit PaymentReceived(
            msg.sender,
            msg.value,
            block.timestamp,
            SEARCHES_PER_PAYMENT
        );
        
        // Refund excess payment
        if (msg.value > searchPrice) {
            uint256 excess = msg.value - searchPrice;
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @dev Get current search price
     * @return Current price in wei for 3 searches
     */
    function getSearchPrice() external view returns (uint256) {
        return searchPrice;
    }

    /**
     * @dev Get searches per payment
     * @return Number of searches per payment
     */
    function getSearchesPerPayment() external pure returns (uint256) {
        return SEARCHES_PER_PAYMENT;
    }

    /**
     * @dev Update search price (only owner)
     * @param _newPrice New price in wei
     */
    function updateSearchPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        
        uint256 oldPrice = searchPrice;
        searchPrice = _newPrice;
        
        emit PriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawal(owner(), balance);
    }

    /**
     * @dev Emergency pause (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract balance
     * @return Contract balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get user payment statistics
     * @param user User address
     * @return totalPaid Total amount paid by user
     * @return searchesPurchased Total searches purchased by user
     */
    function getUserStats(address user) external view returns (
        uint256 totalPaid,
        uint256 searchesPurchased
    ) {
        return (userTotalPaid[user], userSearchesPurchased[user]);
    }

    /**
     * @dev Calculate current ETH price for USD amount
     * This is a placeholder - in production, use an oracle like Chainlink
     * @param usdAmount USD amount in cents (e.g., 1500 for $15.00)
     * @return ETH amount in wei
     */
    function calculateETHForUSD(uint256 usdAmount) external pure returns (uint256) {
        // Placeholder calculation assuming 1 ETH = $2000
        // In production, use Chainlink price feeds
        uint256 ethPriceInCents = 200000; // $2000.00 in cents
        return (usdAmount * 1 ether) / ethPriceInCents;
    }

    /**
     * @dev Fallback function to handle direct ETH transfers
     */
    receive() external payable {
        // Redirect to payForSearch function
        require(msg.value >= searchPrice, "Insufficient payment for search");
        
        // Track user statistics
        userTotalPaid[msg.sender] += msg.value;
        userSearchesPurchased[msg.sender] += SEARCHES_PER_PAYMENT;
        
        emit PaymentReceived(
            msg.sender,
            msg.value,
            block.timestamp,
            SEARCHES_PER_PAYMENT
        );
        
        // Refund excess
        if (msg.value > searchPrice) {
            uint256 excess = msg.value - searchPrice;
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }
    }
}
