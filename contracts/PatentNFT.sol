// SPDX-License-Identifier: MIT
// License identifier required by Solidity for open source compliance
pragma solidity ^0.8.20; // Specify minimum Solidity compiler version

// Import OpenZeppelin contracts for NFT functionality
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // NFT with metadata URI storage
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol"; // NFT enumeration functionality
import "@openzeppelin/contracts/access/Ownable.sol"; // Access control for admin functions
// Counters library removed in newer OpenZeppelin versions - using uint256 instead

/**
 * @title PatentNFT
 * @dev NFT contract for tokenizing patents with verification system
 * Inherits from ERC721URIStorage (NFT with metadata) and Ownable (access control)
 */
contract PatentNFT is ERC721URIStorage, ERC721Enumerable, Ownable { // This Contract "PatentNFT" has the ERC721URIStorage and ERC721Enumerable and Ownable contracts imported from OpenZeppelin so it says "is" in this line
    // Private counter to track and assign unique token IDs
    uint256 private _tokenIds;
    
    // Minting price in wei (0.1 ETH by default)
    uint256 public mintingPrice = 0.1 ether;
    
    // Base URI for metadata (configurable)
    string public baseTokenURI = "http://localhost:3001/metadata/";
    
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
    
    // Mapping to track which patent numbers have been minted
    mapping(string => bool) public patentExists;
    
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
     * Supports US, EP, CN, JP, KR patent number formats
     */
    function validatePatentNumber(string memory _patentNumber) internal pure returns (bool) {
        bytes memory patentBytes = bytes(_patentNumber);
        uint256 length = patentBytes.length;
        
        // Must be at least 8 characters (US1234567)
        if (length < 8 || length > 15) return false;
        
        // Check US format: US followed by 6-8 digits
        if (length >= 8 && 
            patentBytes[0] == 'U' && patentBytes[1] == 'S' &&
            _isDigit(patentBytes[2])) {
            return _validateDigitSequence(patentBytes, 2);
        }
        
        // Check EP format: EP followed by digits and optional letter
        if (length >= 8 && 
            patentBytes[0] == 'E' && patentBytes[1] == 'P' &&
            _isDigit(patentBytes[2])) {
            return true; // EP validation can be more complex, simplified for now
        }
        
        // Check CN format: CN followed by digits and optional letter
        if (length >= 8 && 
            patentBytes[0] == 'C' && patentBytes[1] == 'N' &&
            _isDigit(patentBytes[2])) {
            return true;
        }
        
        return false;
    }
    
    /**
     * @dev Helper function to check if a byte represents a digit (0-9)
     */
    function _isDigit(bytes1 char) internal pure returns (bool) {
        return char >= '0' && char <= '9';
    }
    
    /**
     * @dev Helper function to validate digit sequence
     */
    function _validateDigitSequence(bytes memory data, uint256 startIndex) internal pure returns (bool) {
        for (uint256 i = startIndex; i < data.length; i++) {
            if (!_isDigit(data[i])) {
                // Allow letters at the end for some formats
                if (i >= startIndex + 6) return true;
                return false;
            }
        }
        return true;
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
    
    /**
     * @dev Frontend-compatible minting function with payment
     * @param recipient The address to mint the NFT to
     * @param patentNumber The patent number to mint
     */
    function mintPatentNFT(address recipient, string memory patentNumber) public payable returns (uint256) {
        require(msg.value >= mintingPrice, "Insufficient payment for minting");
        require(!patentExists[patentNumber], "Patent already minted");
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(patentNumber).length > 0, "Patent number required");
        
        // Mark patent as existing
        patentExists[patentNumber] = true;
        
        // Create metadata URI using configurable base URI
        string memory tokenURI = string(abi.encodePacked(baseTokenURI, patentNumber));
        
        // Mint the patent with default values
        return mintPatent(
            recipient,
            tokenURI,
            string(abi.encodePacked("Patent ", patentNumber)), // Default title
            "Unknown", // Default inventor
            patentNumber
        );
    }
    
    /**
     * @dev Returns the current minting price
     */
    function getMintingPrice() public view returns (uint256) {
        return mintingPrice;
    }
    
    /**
     * @dev Set minting price (only owner)
     */
    function setMintingPrice(uint256 _mintingPrice) public onlyOwner {
        mintingPrice = _mintingPrice;
    }
    
    /**
     * @dev Set base URI for metadata (only owner)
     */
    function setBaseTokenURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get total number of minted tokens - override ERC721Enumerable
     */
    function totalSupply() public view override(ERC721Enumerable) returns (uint256) {
        return ERC721Enumerable.totalSupply();
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
