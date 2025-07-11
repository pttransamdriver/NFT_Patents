// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SearchPayment
 * @dev Smart contract for handling AI search payments in PSP tokens
 */
contract SearchPayment is Ownable, ReentrancyGuard, Pausable {
    // Events
    event PaymentReceived(
        address indexed user,
        uint256 tokenAmount,
        uint256 timestamp,
        uint256 searchCredits
    );

    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TokensWithdrawn(address indexed owner, uint256 amount);
    event PSPTokenUpdated(address indexed oldToken, address indexed newToken);

    // State variables
    IERC20 public pspToken; // PSP token contract
    uint256 public searchPriceInPSP; // Price in PSP tokens for 1 search (500 PSP = $5)
    uint256 public constant SEARCHES_PER_PAYMENT = 1; // Changed to 1 search per payment

    // Mapping to track user payments (for reference)
    mapping(address => uint256) public userTotalPaid; // Total PSP tokens paid
    mapping(address => uint256) public userSearchesPurchased;

    /**
     * @dev Constructor sets PSP token and initial search price
     * @param _pspToken Address of the PSP token contract
     * @param _initialPriceInPSP Initial price in PSP tokens for 1 search (500 PSP)
     */
    constructor(address _pspToken, uint256 _initialPriceInPSP) Ownable(msg.sender) {
        require(_pspToken != address(0), "PSP token address cannot be zero");
        pspToken = IERC20(_pspToken);
        searchPriceInPSP = _initialPriceInPSP;
    }

    /**
     * @dev Pay for AI searches using PSP tokens
     * Users transfer PSP tokens to pay for search credits
     */
    function payForSearch() external nonReentrant whenNotPaused {
        require(searchPriceInPSP > 0, "Search price not set");
        require(pspToken.balanceOf(msg.sender) >= searchPriceInPSP, "Insufficient PSP token balance");

        // Transfer PSP tokens from user to this contract
        require(
            pspToken.transferFrom(msg.sender, address(this), searchPriceInPSP),
            "PSP token transfer failed"
        );

        // Track user statistics
        userTotalPaid[msg.sender] += searchPriceInPSP;
        userSearchesPurchased[msg.sender] += SEARCHES_PER_PAYMENT;

        // Emit event for backend to process
        emit PaymentReceived(
            msg.sender,
            searchPriceInPSP,
            block.timestamp,
            SEARCHES_PER_PAYMENT
        );
    }

    /**
     * @dev Get current search price in PSP tokens
     * @return Current price in PSP tokens for 1 search
     */
    function getSearchPrice() external view returns (uint256) {
        return searchPriceInPSP;
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
     * @param _newPrice New price in PSP tokens
     */
    function updateSearchPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");

        uint256 oldPrice = searchPriceInPSP;
        searchPriceInPSP = _newPrice;

        emit PriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @dev Update PSP token contract address (only owner)
     * @param _newPSPToken New PSP token contract address
     */
    function updatePSPToken(address _newPSPToken) external onlyOwner {
        require(_newPSPToken != address(0), "PSP token address cannot be zero");

        address oldToken = address(pspToken);
        pspToken = IERC20(_newPSPToken);

        emit PSPTokenUpdated(oldToken, _newPSPToken);
    }

    /**
     * @dev Withdraw PSP tokens from contract (only owner)
     */
    function withdrawTokens() external onlyOwner nonReentrant {
        uint256 balance = pspToken.balanceOf(address(this));
        require(balance > 0, "No PSP tokens to withdraw");

        require(pspToken.transfer(owner(), balance), "PSP token transfer failed");

        emit TokensWithdrawn(owner(), balance);
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
     * @dev Get contract PSP token balance
     * @return Contract PSP token balance
     */
    function getTokenBalance() external view returns (uint256) {
        return pspToken.balanceOf(address(this));
    }

    /**
     * @dev Get PSP token contract address
     * @return PSP token contract address
     */
    function getPSPTokenAddress() external view returns (address) {
        return address(pspToken);
    }

    /**
     * @dev Get user payment statistics
     * @param user User address
     * @return totalPaid Total PSP tokens paid by user
     * @return searchesPurchased Total searches purchased by user
     */
    function getUserStats(address user) external view returns (
        uint256 totalPaid,
        uint256 searchesPurchased
    ) {
        return (userTotalPaid[user], userSearchesPurchased[user]);
    }
}
