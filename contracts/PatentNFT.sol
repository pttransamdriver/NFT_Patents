// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PatentNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Patent data structure
    struct Patent {
        string title;
        string inventor;
        uint256 filingDate;
        string patentNumber;
        bool isVerified;
    }
    
    // Mapping from token ID to Patent
    mapping(uint256 => Patent) public patents;
    
    // Events
    event PatentMinted(uint256 tokenId, address owner, string patentNumber);
    event PatentVerified(uint256 tokenId, string patentNumber);
    
    constructor() ERC721("PatentNFT", "PNFT") Ownable() {}
    
    // Mint a new patent NFT
    function mintPatent(
        address recipient,
        string memory tokenURI,
        string memory title,
        string memory inventor,
        string memory patentNumber
    ) public returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        patents[newTokenId] = Patent({
            title: title,
            inventor: inventor,
            filingDate: block.timestamp,
            patentNumber: patentNumber,
            isVerified: false
        });
        
        emit PatentMinted(newTokenId, recipient, patentNumber);
        return newTokenId;
    }
    
    // Verify a patent (only owner can do this)
    function verifyPatent(uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Patent does not exist");
        patents[tokenId].isVerified = true;
        emit PatentVerified(tokenId, patents[tokenId].patentNumber);
    }
    
    // Get patent details
    function getPatent(uint256 tokenId) public view returns (
        string memory title,
        string memory inventor,
        uint256 filingDate,
        string memory patentNumber,
        bool isVerified
    ) {
        require(_exists(tokenId), "Patent does not exist");
        Patent memory patent = patents[tokenId];
        return (
            patent.title,
            patent.inventor,
            patent.filingDate,
            patent.patentNumber,
            patent.isVerified
        );
    }
}