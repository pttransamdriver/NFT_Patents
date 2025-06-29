// SPDX-License-Identifier: MIT
// License identifier required by Solidity for open source compliance
pragma solidity ^0.8.20; // Specify minimum Solidity compiler version

// Import OpenZeppelin contracts for NFT functionality
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // NFT with metadata URI storage
import "@openzeppelin/contracts/access/Ownable.sol"; // Access control for admin functions
import "@openzeppelin/contracts/utils/Counters.sol"; // Safe counter for token IDs

/**
 * @title PatentNFT
 * @dev NFT contract for tokenizing patents with verification system
 * Inherits from ERC721URIStorage (NFT with metadata) and Ownable (access control)
 */
contract PatentNFT is ERC721URIStorage, Ownable {
    // Use Counters library for safe increment/decrement operations
    using Counters for Counters.Counter;
    
    // Private counter to track and assign unique token IDs
    Counters.Counter private _tokenIds;
    
    /**
     * @dev Structure to store patent information for each NFT
     */
    struct Patent {
        string title;        // Patent title/name
        string inventor;     // Name of the patent inventor
        uint256 filingDate;  // Timestamp when NFT was minted (simulates filing date)
        string patentNumber; // Official patent number from USPTO
        bool isVerified;     // Whether patent has been verified by contract owner
    }
    
    // Mapping that links each token ID to its patent data
    mapping(uint256 => Patent) public patents;
    
    /**
     * @dev Events emitted by the contract for external monitoring
     */
    event PatentMinted(uint256 tokenId, address owner, string patentNumber);
    event PatentVerified(uint256 tokenId, string patentNumber);
    
    /**
     * @dev Contract constructor - runs once when contract is deployed
     * Sets NFT collection name to "PatentNFT" and symbol to "PNFT"
     */
    constructor() ERC721("PatentNFT", "PNFT") Ownable() {}
    
    /**
     * @dev Creates a new patent NFT and assigns it to a recipient
     * @param recipient Address that will own the new NFT
     * @param tokenURI URL pointing to NFT metadata (JSON file with image, description, etc.)
     * @param title Human-readable name of the patent
     * @param inventor Name of the person who invented/created the patent
     * @param patentNumber Official USPTO patent number
     * @return uint256 The ID of the newly created token
     */
    function mintPatent(
        address recipient,
        string memory tokenURI,
        string memory title,
        string memory inventor,
        string memory patentNumber
    ) public returns (uint256) {
        // Increment the counter to get next available token ID
        _tokenIds.increment();
        
        // Get the current counter value as the new token ID
        uint256 newTokenId = _tokenIds.current();
        
        // Create the NFT and assign ownership to recipient
        _mint(recipient, newTokenId);
        
        // Set the metadata URI for this token (points to JSON metadata)
        _setTokenURI(newTokenId, tokenURI);
        
        // Store patent information in our mapping
        patents[newTokenId] = Patent({
            title: title,
            inventor: inventor,
            filingDate: block.timestamp, // Current blockchain timestamp
            patentNumber: patentNumber,
            isVerified: false // New patents start unverified
        });
        
        // Emit event to notify external systems about the new patent NFT
        emit PatentMinted(newTokenId, recipient, patentNumber);
        
        // Return the token ID for the caller to use
        return newTokenId;
    }
    
    /**
     * @dev Marks a patent as verified (only contract owner can do this)
     * @param tokenId The ID of the token to verify
     * 
     * This function is restricted to the contract owner using the onlyOwner modifier
     */
    function verifyPatent(uint256 tokenId) public onlyOwner {
        // Check that the token actually exists before trying to verify it
        require(_exists(tokenId), "Patent does not exist");
        
        // Set the verification status to true
        patents[tokenId].isVerified = true;
        
        // Emit event to notify that patent has been verified
        emit PatentVerified(tokenId, patents[tokenId].patentNumber);
    }
    
    /**
     * @dev Retrieves all patent information for a given token ID
     * @param tokenId The ID of the token to query
     * @return title The patent title
     * @return inventor The inventor's name
     * @return filingDate Timestamp when the NFT was minted
     * @return patentNumber The official patent number
     * @return isVerified Whether the patent has been verified
     * 
     * This is a view function - it doesn't modify state and costs no gas to call
     */
    function getPatent(uint256 tokenId) public view returns (
        string memory title,
        string memory inventor,
        uint256 filingDate,
        string memory patentNumber,
        bool isVerified
    ) {
        // Ensure the token exists before trying to read its data
        require(_exists(tokenId), "Patent does not exist");
        
        // Load the patent data from storage into memory for efficiency
        Patent memory patent = patents[tokenId];
        
        // Return all patent fields as a tuple
        return (
            patent.title,
            patent.inventor,
            patent.filingDate,
            patent.patentNumber,
            patent.isVerified
        );
    }
}