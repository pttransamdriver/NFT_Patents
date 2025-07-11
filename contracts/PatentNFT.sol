// SPDX-License-Identifier: MIT
// License identifier required by Solidity for open source compliance
pragma solidity ^0.8.20; // Specify minimum Solidity compiler version

// Import OpenZeppelin contracts for NFT functionality
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // NFT with metadata URI storage
import "@openzeppelin/contracts/access/Ownable.sol"; // Access control for admin functions
// Counters library removed in newer OpenZeppelin versions - using uint256 instead

/**
 * @title PatentNFT
 * @dev NFT contract for tokenizing patents with verification system
 * Inherits from ERC721URIStorage (NFT with metadata) and Ownable (access control)
 */
contract PatentNFT is ERC721URIStorage, Ownable {
    // Private counter to track and assign unique token IDs
    uint256 private _tokenIds;
    
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
    constructor() ERC721("PatentNFT", "PNFT") Ownable(msg.sender) {}
    
    /**
     * @dev Creates a new patent NFT and assigns it to a recipient
     * @param recipient Address that will own the new NFT
     * @param tokenURI URL pointing to NFT metadata (JSON file with image, description, etc.)
     * @param title Human-readable name of the patent
     * @param inventor Name of the person who invented/created the patent
     * @param patentNumber Official USPTO patent number
     * @return uint256 The ID of the newly created token
     */
    // Function to mint the patents
    function mintPatent(
        address recipient, // This id the address of the user who is minting the patent
        string memory tokenURI, // This is the URL that points to the metadata of the patent
        string memory title, // This is the NFT title/name of the patent
        string memory inventor, // This variable "inventor" is the name of the person who invented the patent
        string memory patentNumber // This is the official USPTO patent number
    ) public returns (uint256) { // Returns a publicly visible variable of type uint256
        // Input validation for security
        require(recipient != address(0), "Invalid recipient address"); // This checks that the recipient address is not the zero address
        require(bytes(tokenURI).length > 0, "Token URI required"); // Requires a non-empty token URI
        require(bytes(title).length > 0, "Title required"); // Requires a non-empty title for the patent
        require(bytes(inventor).length > 0, "Inventor required"); // Requires a non-empty inventor name
        require(bytes(patentNumber).length > 0, "Patent number required"); // Requires a non-empty patent number
        require(validatePatentNumber(patentNumber), "Invalid patent number format"); // Validates the patent number format

        // Increment the counter to get next available token ID
        _tokenIds++;

        // Get the current counter value as the new token ID
        uint256 newTokenId = _tokenIds;
        
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
        require(_ownerOf(tokenId) != address(0), "Patent does not exist");
        
        // Set the verification status to true
        patents[tokenId].isVerified = true;
        
        // Emit event to notify that patent has been verified
        emit PatentVerified(tokenId, patents[tokenId].patentNumber);
    }
    /**
     * @dev Internal function to validate the format of a patent number.
     * This is a placeholder and should be replaced with robust validation logic.
     */
    function validatePatentNumber(string memory _patentNumber) internal pure returns (bool) {
        return bytes(_patentNumber).length > 0; // Simple check for non-empty string
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
        require(_ownerOf(tokenId) != address(0), "Patent does not exist");
        
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