// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    uint256 private _listingIds;

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => uint256)) public tokenToListing;
    
    uint256 public platformFeePercent = 250; // 2.5% (250 basis points)
    address public feeRecipient;

    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event NFTSold(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );

    event ListingCancelled(uint256 indexed listingId);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(IERC721(nftContract).getApproved(tokenId) == address(this) || 
                IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), 
                "Contract not approved");

        _listingIds++;
        uint256 listingId = _listingIds;

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
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

        // Transfer payments using secure call pattern
        (bool sellerSuccess, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");
        
        (bool feeSuccess, ) = payable(feeRecipient).call{value: platformFee}("");
        require(feeSuccess, "Fee payment failed");

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
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

        listing.price = newPrice;
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

    function setPlatformFee(uint256 _platformFeePercent) external onlyOwner {
        require(_platformFeePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = _platformFeePercent;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}