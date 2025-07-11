// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PSPToken (Patent Search Pennies)
 * @dev ERC20 token for AI patent search payments
 * 1 PSP = $0.01 USD, so 500 PSP = $5.00 for one AI search
 */
contract PSPToken is ERC20, ERC20Burnable, Ownable, Pausable {
    // Events
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid);
    event TokensRedeemed(address indexed user, uint256 amount, uint256 ethReceived);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    
    // State variables
    uint256 public tokenPriceInWei; // Price of 1 PSP token in wei
    uint256 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**DECIMALS; // 1 million PSP tokens
    uint256 public constant MAX_SUPPLY = 10000000 * 10**DECIMALS; // 10 million PSP tokens max
    
    // Mapping to track authorized contracts that can spend tokens on behalf of users
    mapping(address => bool) public authorizedSpenders;
    
    /**
     * @dev Constructor initializes the PSP token
     * @param _initialTokenPrice Initial price of 1 PSP token in wei
     */
    constructor(uint256 _initialTokenPrice) 
        ERC20("Patent Search Pennies", "PSP") 
        Ownable(msg.sender) 
    {
        tokenPriceInWei = _initialTokenPrice;
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Purchase PSP tokens with ETH
     * Users can buy PSP tokens to use for AI searches
     */
    function purchaseTokens() external payable whenNotPaused {
        require(msg.value > 0, "Must send ETH to purchase tokens");
        
        uint256 tokenAmount = (msg.value * 10**DECIMALS) / tokenPriceInWei;
        require(tokenAmount > 0, "Insufficient ETH for minimum token purchase");
        
        // Check if we need to mint new tokens
        uint256 currentSupply = totalSupply();
        if (currentSupply + tokenAmount > MAX_SUPPLY) {
            revert("Would exceed maximum token supply");
        }
        
        // Mint tokens to buyer
        _mint(msg.sender, tokenAmount);
        
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }
    
    /**
     * @dev Redeem PSP tokens for ETH (if contract has ETH balance)
     * @param tokenAmount Amount of PSP tokens to redeem
     */
    function redeemTokens(uint256 tokenAmount) external whenNotPaused {
        require(tokenAmount > 0, "Must redeem positive amount");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        uint256 ethAmount = (tokenAmount * tokenPriceInWei) / 10**DECIMALS;
        require(address(this).balance >= ethAmount, "Insufficient contract ETH balance");
        
        // Burn tokens from user
        _burn(msg.sender, tokenAmount);
        
        // Send ETH to user
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit TokensRedeemed(msg.sender, tokenAmount, ethAmount);
    }
    
    /**
     * @dev Set authorized spender (like SearchPayment contract)
     * @param spender Address to authorize
     * @param authorized Whether to authorize or deauthorize
     */
    function setAuthorizedSpender(address spender, bool authorized) external onlyOwner {
        authorizedSpenders[spender] = authorized;
    }
    
    /**
     * @dev Spend tokens on behalf of user (only authorized contracts)
     * @param user User whose tokens to spend
     * @param amount Amount of tokens to spend
     */
    function spendTokensFor(address user, uint256 amount) external {
        require(authorizedSpenders[msg.sender], "Not authorized to spend tokens");
        require(balanceOf(user) >= amount, "Insufficient user token balance");
        
        _burn(user, amount);
    }
    
    /**
     * @dev Update token price (only owner)
     * @param _newPrice New price in wei for 1 PSP token
     */
    function updateTokenPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        
        uint256 oldPrice = tokenPriceInWei;
        tokenPriceInWei = _newPrice;
        
        emit PriceUpdated(oldPrice, _newPrice);
    }
    
    /**
     * @dev Mint additional tokens (only owner, respects max supply)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed maximum supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Get current token price
     * @return Current price of 1 PSP token in wei
     */
    function getTokenPrice() external view returns (uint256) {
        return tokenPriceInWei;
    }
    
    /**
     * @dev Calculate PSP tokens for given ETH amount
     * @param ethAmount Amount of ETH in wei
     * @return Amount of PSP tokens that can be purchased
     */
    function calculateTokensForETH(uint256 ethAmount) external view returns (uint256) {
        return (ethAmount * 10**DECIMALS) / tokenPriceInWei;
    }
    
    /**
     * @dev Calculate ETH needed for given PSP token amount
     * @param tokenAmount Amount of PSP tokens
     * @return Amount of ETH in wei needed
     */
    function calculateETHForTokens(uint256 tokenAmount) external view returns (uint256) {
        return (tokenAmount * tokenPriceInWei) / 10**DECIMALS;
    }
    
    /**
     * @dev Withdraw contract ETH balance (only owner)
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");
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
     * @dev Override transfer to check pause status
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
    
    /**
     * @dev Get contract ETH balance
     * @return Contract balance in wei
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
