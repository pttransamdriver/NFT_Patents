// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SearchPayment
 * @dev Smart contract for handling AI search payments in multiple tokens (ETH, USDC, PSP)
 */
contract SearchPayment is Ownable, ReentrancyGuard, Pausable {
    // Supported payment tokens
    enum PaymentToken { ETH, USDC, PSP }

    // Events
    event PaymentReceived(
        address indexed user,
        PaymentToken indexed paymentMethod,
        uint256 amount,
        uint256 timestamp,
        uint256 searchCredits
    );

    event PriceUpdated(PaymentToken indexed token, uint256 oldPrice, uint256 newPrice);
    event TokensWithdrawn(address indexed owner, PaymentToken indexed token, uint256 amount);
    event TokenAddressUpdated(PaymentToken indexed token, address indexed oldAddress, address indexed newAddress);

    // State variables
    IERC20 public pspToken; // PSP token contract
    IERC20 public usdcToken; // USDC token contract

    // Bit-packed search prices - all fit in one 32-byte storage slot
    // All equivalent to $5 USD
    uint88 public searchPriceInETH;   // 11 bytes - Price in ETH (wei) for 1 search
    uint88 public searchPriceInUSDC;  // 11 bytes - Price in USDC (6 decimals) for 1 search
    uint80 public searchPriceInPSP;   // 10 bytes - Price in PSP tokens for 1 search (500 PSP = $5)

    uint256 public constant SEARCHES_PER_PAYMENT = 1;

    // Mapping to track user payments by token type
    mapping(address => mapping(PaymentToken => uint256)) public userTotalPaid;
    mapping(address => uint256) public userSearchesPurchased;

    /**
     * @dev Constructor sets token addresses and initial search prices
     * @param _pspToken Address of the PSP token contract
     * @param _usdcToken Address of the USDC token contract
     * @param _initialPriceInETH Initial price in ETH (wei) for 1 search
     * @param _initialPriceInUSDC Initial price in USDC (6 decimals) for 1 search
     * @param _initialPriceInPSP Initial price in PSP tokens for 1 search (500 PSP)
     */
    constructor(
        address _pspToken,
        address _usdcToken,
        uint88 _initialPriceInETH,
        uint88 _initialPriceInUSDC,
        uint80 _initialPriceInPSP
    ) Ownable(msg.sender) {
        require(_pspToken != address(0), "PSP token address cannot be zero");
        require(_usdcToken != address(0), "USDC token address cannot be zero");

        pspToken = IERC20(_pspToken);
        usdcToken = IERC20(_usdcToken);
        searchPriceInETH = _initialPriceInETH;
        searchPriceInUSDC = _initialPriceInUSDC;
        searchPriceInPSP = _initialPriceInPSP;
    }

    /**
     * @dev Pay for AI searches using ETH
     */
    function payWithETH() external payable nonReentrant whenNotPaused {
        require(searchPriceInETH > 0, "ETH search price not set");
        require(msg.value >= searchPriceInETH, "Insufficient ETH payment");

        // Refund excess ETH if any
        if (msg.value > searchPriceInETH) {
            uint256 excess = msg.value - searchPriceInETH;
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "ETH refund failed");
        }

        // Track user statistics
        userTotalPaid[msg.sender][PaymentToken.ETH] += searchPriceInETH;
        userSearchesPurchased[msg.sender] += SEARCHES_PER_PAYMENT;

        // Emit event for backend to process
        emit PaymentReceived(
            msg.sender,
            PaymentToken.ETH,
            searchPriceInETH,
            block.timestamp,
            SEARCHES_PER_PAYMENT
        );
    }

    /**
     * @dev Pay for AI searches using USDC tokens
     */
    function payWithUSDC() external nonReentrant whenNotPaused {
        require(searchPriceInUSDC > 0, "USDC search price not set");
        require(usdcToken.balanceOf(msg.sender) >= searchPriceInUSDC, "Insufficient USDC balance");

        // Transfer USDC tokens from user to this contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), searchPriceInUSDC),
            "USDC token transfer failed"
        );

        // Track user statistics
        userTotalPaid[msg.sender][PaymentToken.USDC] += searchPriceInUSDC;
        userSearchesPurchased[msg.sender] += SEARCHES_PER_PAYMENT;

        // Emit event for backend to process
        emit PaymentReceived(
            msg.sender,
            PaymentToken.USDC,
            searchPriceInUSDC,
            block.timestamp,
            SEARCHES_PER_PAYMENT
        );
    }

    /**
     * @dev Pay for AI searches using PSP tokens
     */
    function payWithPSP() external nonReentrant whenNotPaused {
        require(searchPriceInPSP > 0, "PSP search price not set");
        require(pspToken.balanceOf(msg.sender) >= searchPriceInPSP, "Insufficient PSP token balance");

        // Transfer PSP tokens from user to this contract
        require(
            pspToken.transferFrom(msg.sender, address(this), searchPriceInPSP),
            "PSP token transfer failed"
        );

        // Track user statistics
        userTotalPaid[msg.sender][PaymentToken.PSP] += searchPriceInPSP;
        userSearchesPurchased[msg.sender] += SEARCHES_PER_PAYMENT;

        // Emit event for backend to process
        emit PaymentReceived(
            msg.sender,
            PaymentToken.PSP,
            searchPriceInPSP,
            block.timestamp,
            SEARCHES_PER_PAYMENT
        );
    }

    /**
     * @dev Legacy function for backward compatibility - uses PSP tokens
     */
    function payForSearch() external nonReentrant whenNotPaused {
        require(searchPriceInPSP > 0, "PSP search price not set");
        require(pspToken.balanceOf(msg.sender) >= searchPriceInPSP, "Insufficient PSP token balance");

        // Transfer PSP tokens from user to this contract
        require(
            pspToken.transferFrom(msg.sender, address(this), searchPriceInPSP),
            "PSP token transfer failed"
        );

        // Track user statistics
        userTotalPaid[msg.sender][PaymentToken.PSP] += searchPriceInPSP;
        userSearchesPurchased[msg.sender] += SEARCHES_PER_PAYMENT;

        // Emit event for backend to process
        emit PaymentReceived(
            msg.sender,
            PaymentToken.PSP,
            searchPriceInPSP,
            block.timestamp,
            SEARCHES_PER_PAYMENT
        );
    }

    /**
     * @dev Get current search price for specific payment method
     * @param token Payment token type
     * @return Current price for 1 search in specified token
     */
    function getSearchPrice(PaymentToken token) external view returns (uint256) {
        if (token == PaymentToken.ETH) {
            return searchPriceInETH;
        } else if (token == PaymentToken.USDC) {
            return searchPriceInUSDC;
        } else if (token == PaymentToken.PSP) {
            return searchPriceInPSP;
        }
        return 0;
    }

    /**
     * @dev Legacy function - returns PSP price for backward compatibility
     * @return Current price in PSP tokens for 1 search
     */
    function getSearchPriceLegacy() external view returns (uint256) {
        return searchPriceInPSP;
    }

    /**
     * @dev Get all search prices
     * @return ethPrice Price in ETH (wei)
     * @return usdcPrice Price in USDC (6 decimals)
     * @return pspPrice Price in PSP tokens (18 decimals)
     */
    function getAllSearchPrices() external view returns (
        uint256 ethPrice,
        uint256 usdcPrice,
        uint256 pspPrice
    ) {
        return (searchPriceInETH, searchPriceInUSDC, searchPriceInPSP);
    }

    /**
     * @dev Get searches per payment
     * @return Number of searches per payment
     */
    function getSearchesPerPayment() external pure returns (uint256) {
        return SEARCHES_PER_PAYMENT;
    }

    /**
     * @dev Update search price for specific payment method (only owner)
     * @param token Payment token type
     * @param _newPrice New price for specified token
     */
    function updateSearchPrice(PaymentToken token, uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");

        uint256 oldPrice;

        if (token == PaymentToken.ETH) {
            oldPrice = searchPriceInETH;
            searchPriceInETH = uint88(_newPrice);
        } else if (token == PaymentToken.USDC) {
            oldPrice = searchPriceInUSDC;
            searchPriceInUSDC = uint88(_newPrice);
        } else if (token == PaymentToken.PSP) {
            oldPrice = searchPriceInPSP;
            searchPriceInPSP = uint80(_newPrice);
        } else {
            revert("Invalid payment token");
        }

        emit PriceUpdated(token, oldPrice, _newPrice);
    }

    /**
     * @dev Legacy function - update PSP price for backward compatibility
     * @param _newPrice New price in PSP tokens
     */
    function updateSearchPriceLegacy(uint80 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");

        uint256 oldPrice = searchPriceInPSP;
        searchPriceInPSP = _newPrice;

        emit PriceUpdated(PaymentToken.PSP, oldPrice, _newPrice);
    }

    /**
     * @dev Update token contract address (only owner)
     * @param token Payment token type
     * @param _newTokenAddress New token contract address
     */
    function updateTokenAddress(PaymentToken token, address _newTokenAddress) external onlyOwner {
        require(_newTokenAddress != address(0), "Token address cannot be zero");

        address oldToken;

        if (token == PaymentToken.USDC) {
            oldToken = address(usdcToken);
            usdcToken = IERC20(_newTokenAddress);
        } else if (token == PaymentToken.PSP) {
            oldToken = address(pspToken);
            pspToken = IERC20(_newTokenAddress);
        } else {
            revert("Cannot update ETH address");
        }

        emit TokenAddressUpdated(token, oldToken, _newTokenAddress);
    }

    /**
     * @dev Legacy function - update PSP token for backward compatibility
     * @param _newPSPToken New PSP token contract address
     */
    function updatePSPToken(address _newPSPToken) external onlyOwner {
        require(_newPSPToken != address(0), "PSP token address cannot be zero");

        address oldToken = address(pspToken);
        pspToken = IERC20(_newPSPToken);

        emit TokenAddressUpdated(PaymentToken.PSP, oldToken, _newPSPToken);
    }

    /**
     * @dev Withdraw ETH from contract (only owner)
     */
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "ETH withdrawal failed");

        emit TokensWithdrawn(owner(), PaymentToken.ETH, balance);
    }

    /**
     * @dev Withdraw USDC tokens from contract (only owner)
     */
    function withdrawUSDC() external onlyOwner nonReentrant {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "No USDC tokens to withdraw");

        require(usdcToken.transfer(owner(), balance), "USDC token transfer failed");

        emit TokensWithdrawn(owner(), PaymentToken.USDC, balance);
    }

    /**
     * @dev Withdraw PSP tokens from contract (only owner)
     */
    function withdrawPSP() external onlyOwner nonReentrant {
        uint256 balance = pspToken.balanceOf(address(this));
        require(balance > 0, "No PSP tokens to withdraw");

        require(pspToken.transfer(owner(), balance), "PSP token transfer failed");

        emit TokensWithdrawn(owner(), PaymentToken.PSP, balance);
    }

    /**
     * @dev Legacy function - withdraw PSP tokens for backward compatibility
     */
    function withdrawTokens() external onlyOwner nonReentrant {
        uint256 balance = pspToken.balanceOf(address(this));
        require(balance > 0, "No PSP tokens to withdraw");

        require(pspToken.transfer(owner(), balance), "PSP token transfer failed");

        emit TokensWithdrawn(owner(), PaymentToken.PSP, balance);
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
     * @dev Get contract balance for specific token
     * @param token Payment token type
     * @return Contract balance for specified token
     */
    function getTokenBalance(PaymentToken token) external view returns (uint256) {
        if (token == PaymentToken.ETH) {
            return address(this).balance;
        } else if (token == PaymentToken.USDC) {
            return usdcToken.balanceOf(address(this));
        } else if (token == PaymentToken.PSP) {
            return pspToken.balanceOf(address(this));
        }
        return 0;
    }

    /**
     * @dev Legacy function - get PSP token balance for backward compatibility
     * @return Contract PSP token balance
     */
    function getTokenBalanceLegacy() external view returns (uint256) {
        return pspToken.balanceOf(address(this));
    }

    /**
     * @dev Get token contract addresses
     * @return pspAddress PSP token contract address
     * @return usdcAddress USDC token contract address
     */
    function getTokenAddresses() external view returns (
        address pspAddress,
        address usdcAddress
    ) {
        return (address(pspToken), address(usdcToken));
    }

    /**
     * @dev Legacy function - get PSP token address for backward compatibility
     * @return PSP token contract address
     */
    function getPSPTokenAddress() external view returns (address) {
        return address(pspToken);
    }

    /**
     * @dev Get user payment statistics for specific token
     * @param user User address
     * @param token Payment token type
     * @return totalPaid Total amount paid by user in specified token
     */
    function getUserTokenStats(address user, PaymentToken token) external view returns (uint256 totalPaid) {
        return userTotalPaid[user][token];
    }

    /**
     * @dev Get user payment statistics (all tokens combined)
     * @param user User address
     * @return ethPaid Total ETH paid by user
     * @return usdcPaid Total USDC paid by user
     * @return pspPaid Total PSP tokens paid by user
     * @return searchesPurchased Total searches purchased by user
     */
    function getUserStats(address user) external view returns (
        uint256 ethPaid,
        uint256 usdcPaid,
        uint256 pspPaid,
        uint256 searchesPurchased
    ) {
        return (
            userTotalPaid[user][PaymentToken.ETH],
            userTotalPaid[user][PaymentToken.USDC],
            userTotalPaid[user][PaymentToken.PSP],
            userSearchesPurchased[user]
        );
    }
}
