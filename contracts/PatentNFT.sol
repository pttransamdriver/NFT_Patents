// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/// @title PatentNFT
/// @notice ERC721 NFT collection where each patent number can only be minted once.
///         Metadata is stored on IPFS for full decentralization. IPFS URIs (ipfs://) are stored on-chain.
///         Royalties supported via ERC2981.
contract PatentNFT is ERC721URIStorage, ERC721Enumerable, ERC2981, Ownable, ReentrancyGuard {
    // Bit-packed state variables - all fit in one 32-byte storage slot
    uint96 private _nextTokenId;                // 12 bytes - supports 79+ octillion tokens
    uint96 public mintingPrice = 0.05 ether;    // 12 bytes - supports up to 79 billion ETH
    uint64 public platformFeePercentage = 250;  // 8 bytes - (250 = 2.5%)

    // Base URI for metadata - kept for backward compatibility and admin minting
    // Note: Public minting now uses IPFS URIs directly for full decentralization
    string public baseMetadataURI;

    // mapping from normalized patent hash → tokenId
    mapping(bytes32 => uint256) private _patentHashToTokenId;

    event PatentMinted(address indexed to, uint256 indexed tokenId, string patentNumber, string tokenURI);
    event MintingPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event FeeWithdrawn(address indexed to, uint256 amount);
    event BaseMetadataURIUpdated(string oldURI, string newURI);

    constructor(address royaltyReceiver, uint96 royaltyFeeNumerator, string memory _baseMetadataURI)
        ERC721("PatentNFT", "PAT")
        Ownable(msg.sender)
    {
        // Set default royalty (e.g. 500 = 5%)
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);

        // Set base metadata URI (optional, kept for backward compatibility)
        // Public minting now uses IPFS URIs directly
        baseMetadataURI = _baseMetadataURI;
    }

    // ------------------------
    // Minting
    // ------------------------

    /// @notice Mint a new Patent NFT with payment (public function)
    /// @param to Receiver of the NFT.
    /// @param patentNumber Raw patent number string.
    /// @param ipfsHash IPFS hash of the metadata JSON (without "ipfs://" prefix).
    function mintPatentNFT(address to, string memory patentNumber, string memory ipfsHash) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintingPrice, "Insufficient payment for minting");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");

        bytes32 key = _normalizePatentId(patentNumber);
        require(_patentHashToTokenId[key] == 0, "Patent already minted");

        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);

        // Generate decentralized IPFS URI
        string memory uri = string(abi.encodePacked("ipfs://", ipfsHash));
        _setTokenURI(tokenId, uri);

        _patentHashToTokenId[key] = tokenId;

        emit PatentMinted(to, tokenId, patentNumber, uri);
        return tokenId;
    }
    
    /// @notice Admin-only mint function (for special cases)
    /// @param to Receiver of the NFT.
    /// @param patentNumber Raw patent number string.
    /// @param uri Metadata URI (IPFS JSON).
    function mintPatent(address to, string memory patentNumber, string memory uri) external onlyOwner returns (uint256) {
        bytes32 key = _normalizePatentId(patentNumber);
        require(_patentHashToTokenId[key] == 0, "Patent already minted");

        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        _patentHashToTokenId[key] = tokenId;

        emit PatentMinted(to, tokenId, patentNumber, uri);
        return tokenId;
    }

    /// @notice Get the tokenId for a given patent number (0 if not minted).
    function patentTokenId(string memory patentNumber) public view returns (uint256) {
        bytes32 key = _normalizePatentId(patentNumber);
        return _patentHashToTokenId[key];
    }

    /// @notice Check whether a patent has already been minted.
    function patentExists(string memory patentNumber) public view returns (bool) {
        return patentTokenId(patentNumber) != 0;
    }

    // ------------------------
    // Price Management & Withdraw
    // ------------------------
    
    /// @notice Get current minting price
    function getMintingPrice() external view returns (uint256) {
        return mintingPrice;
    }
    
    /// @notice Update minting price (owner only)
    function setMintingPrice(uint96 newPrice) external onlyOwner {
        uint96 oldPrice = mintingPrice;
        mintingPrice = newPrice;
        emit MintingPriceUpdated(oldPrice, newPrice);
    }

    /// @notice Update base metadata URI (owner only)
    /// @param newBaseURI New base URI for metadata (e.g., "https://your-backend.vercel.app/api/metadata/")
    function setBaseMetadataURI(string memory newBaseURI) external onlyOwner {
        string memory oldURI = baseMetadataURI;
        baseMetadataURI = newBaseURI;
        emit BaseMetadataURIUpdated(oldURI, newBaseURI);
    }

    /// @notice Withdraw contract ETH balance to owner.
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
        emit FeeWithdrawn(owner(), balance);
    }

    // ------------------------
    // Internal helpers
    // ------------------------

    /// @dev Normalize a patent number string:
    ///      - strip spaces/dashes
    ///      - uppercase ASCII letters
    ///      Then return keccak256 hash.
    function _normalizePatentId(string memory input) internal pure returns (bytes32) {
        bytes memory b = bytes(input);
        bytes memory tmp = new bytes(b.length);
        uint256 j;
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == 0x20 || c == 0x2D) continue; // skip space & dash
            if (c >= 0x61 && c <= 0x7A) {
                tmp[j++] = bytes1(uint8(c) - 32); // a-z → A-Z
            } else {
                tmp[j++] = c;
            }
        }
        bytes memory norm = new bytes(j);
        for (uint256 k = 0; k < j; k++) {
            norm[k] = tmp[k];
        }
        return keccak256(norm);
    }

    // ------------------------
    // Overrides
    // ------------------------

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
