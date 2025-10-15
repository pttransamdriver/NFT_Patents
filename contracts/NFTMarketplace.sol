// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// The name of the contract is NFTMarketplace and "is" ReentrancyGuard and Ownable which come from OpenZeppelin
contract NFTMarketplace is ReentrancyGuard, Ownable {
    // Bit-packed state variables - fit in one 32-byte storage slot
    uint128 private _listingIds;            // 16 bytes - supports 340 undecillion listings
    uint128 public platformFeePercent = 250; // 16 bytes - 2.5% (250 basis points)

    // Bit-packed struct - optimized from 5 slots to 3 slots (40% reduction)
    struct Listing {
        uint96 listingId;       // 12 bytes - supports 79+ octillion listings
        address nftContract;    // 20 bytes - NFT contract address
        uint96 tokenId;         // 12 bytes - supports 79+ octillion token IDs
        address seller;         // 20 bytes - seller's address
        uint128 price;          // 16 bytes - supports up to 340 undecillion wei
        bool active;            // 1 byte - listing status
    }

    // Mapping from listing ID to listing details, public so it can be read from frontend
    mapping(uint256 => Listing) public listings;
    // Mapping from NFT contract and token ID to listing ID. So it takes the contract address and token ID and returns the listing ID
    mapping(address => mapping(uint256 => uint256)) public tokenToListing;

    // Mapping from user address to pending withdrawal amount so it can pull funds from the contract
    mapping(address => uint256) public pendingWithdrawals;

    address public feeRecipient; // Address to receive platform fees. This is the address of the person who deployed the contract

    // These events are emitted when an NFT is listed. These return the listing ID, the NFT contract address, the token ID, the seller's address, and the price of the NFT
    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    
    // This event is emitted when an NFT is sold. It returns the listing ID, the NFT contract address, the token ID, the seller's address, the buyer's address, and the price of the NFT
    event NFTSold(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    // This event is emitted when a listing is cancelled. It returns the listing ID
    event ListingCancelled(uint256 indexed listingId);
    // This event is emitted when funds are credited to an account. It returns the recipient's address and the amount credited
    event FundsDeposited(address indexed recipient, uint256 amount);
    // This event is emitted when funds are withdrawn from the contract account. It returns the recipient's address and the amount withdrawn
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    // This event is emitted when the platform fee is updated. It returns the old fee and the new fee
    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Fee recipient cannot be zero address");
        feeRecipient = _feeRecipient;
    }
    // This function lists the NFT from the user to the marketplace
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
        // "external" means that this function can only be called from outside the contract. It keeps the function from being called from within the contract which is needed for se
    ) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(IERC721(nftContract).getApproved(tokenId) == address(this) || 
                IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), 
                "Contract not approved");

        _listingIds++;
        uint128 listingId = _listingIds;

        listings[listingId] = Listing({
            listingId: uint96(listingId),
            nftContract: nftContract,
            tokenId: uint96(tokenId),
            seller: msg.sender,
            price: uint128(price),
            active: true
        });

        tokenToListing[nftContract][tokenId] = listingId;

        emit NFTListed(listingId, nftContract, tokenId, msg.sender, price);
    }

    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        require(feeRecipient != address(0), "Fee recipient not set");

        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;

        uint256 platformFee = (listing.price * platformFeePercent) / 10000;
        uint256 sellerAmount = listing.price - platformFee;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Credit seller and fee recipient using pull payments pattern
        if (sellerAmount > 0) {
            _creditAccount(listing.seller, sellerAmount);
        }
        
        if (platformFee > 0) {
            _creditAccount(feeRecipient, platformFee);
        }

        // Refund excess payment
        if (msg.value > listing.price) {
            _creditAccount(msg.sender, msg.value - listing.price);
        }

        emit NFTSold(
            listingId,
            listing.nftContract,
            listing.tokenId,
            listing.seller,
            msg.sender,
            listing.price
        );
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || msg.sender == owner(), "Not authorized");
        require(listing.active, "Listing not active");

        listing.active = false;
        tokenToListing[listing.nftContract][listing.tokenId] = 0;

        emit ListingCancelled(listingId);
    }

    function updatePrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");
        require(newPrice > 0, "Price must be greater than 0");

        listing.price = uint128(newPrice);
    }

    function getActiveListing(address nftContract, uint256 tokenId) 
        external 
        view 
        returns (Listing memory) 
    {
        uint256 listingId = tokenToListing[nftContract][tokenId];
        require(listingId > 0, "No listing found");
        require(listings[listingId].active, "Listing not active");
        return listings[listingId];
    }

    function getAllActiveListings() external view returns (Listing[] memory) {
        uint256 totalListings = _listingIds;
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }

        // Create array of active listings
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].active) {
                activeListings[currentIndex] = listings[i];
                currentIndex++;
            }
        }

        return activeListings;
    }

    function setPlatformFee(uint128 _platformFeePercent) external onlyOwner {
        require(_platformFeePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = _platformFeePercent;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Fee recipient cannot be zero address");
        feeRecipient = _feeRecipient;
    }

    function _creditAccount(address recipient, uint256 amount) internal {
        pendingWithdrawals[recipient] += amount;
        emit FundsDeposited(recipient, amount);
    }

    function withdrawFunds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");
        
        emit FundsWithdrawn(msg.sender, amount);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}