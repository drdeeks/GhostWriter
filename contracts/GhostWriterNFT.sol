// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GhostWriterNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    struct NFTData {
        string storyId;
        string storyTitle;
        uint256 wordPosition;
        uint256 totalWords;
        string wordType;
        string contributedWord;
        address contributor;
        uint256 contributionTimestamp;
        bool storyComplete;
        bool revealed;
        bool isCreatorNFT;
        string fullStoryTemplate;
    }

    mapping(uint256 => NFTData) public nftData;
    mapping(string => uint256[]) public storyTokens;
    mapping(string => mapping(uint256 => mapping(address => bool))) public hasContributed;

    string private _hiddenBaseURI;
    string private _revealedBaseURI;
    address public storyManager;

    event MetadataUpdate(uint256 _tokenId);
    event StoryManagerUpdated(address indexed newManager);

    modifier onlyStoryManager() {
        require(msg.sender == storyManager, "Only StoryManager can call");
        _;
    }

    constructor(string memory hiddenURI, string memory revealedURI) ERC721("Ghost Writer NFT", "GHOST") Ownable(msg.sender) {
        _hiddenBaseURI = hiddenURI;
        _revealedBaseURI = revealedURI;
    }

    function setStoryManager(address _storyManager) external onlyOwner {
        storyManager = _storyManager;
        emit StoryManagerUpdated(_storyManager);
    }

    function updateBaseURIs(string memory hiddenURI, string memory revealedURI) external onlyOwner {
        _hiddenBaseURI = hiddenURI;
        _revealedBaseURI = revealedURI;
    }

    function mintHiddenNFT(
        address contributor, string memory storyId, string memory storyTitle,
        uint256 position, uint256 totalWords, string memory wordType, string memory word
    ) external onlyStoryManager returns (uint256) {
        require(!hasContributed[storyId][position][contributor], "Already contributed");
        hasContributed[storyId][position][contributor] = true;
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(contributor, tokenId);
        nftData[tokenId] = NFTData({
            storyId: storyId, storyTitle: storyTitle, wordPosition: position, totalWords: totalWords,
            wordType: wordType, contributedWord: word, contributor: contributor,
            contributionTimestamp: block.timestamp, storyComplete: false, revealed: false,
            isCreatorNFT: false, fullStoryTemplate: ""
        });
        storyTokens[storyId].push(tokenId);
        return tokenId;
    }

    function mintCreatorNFT(address creator, string memory storyId, string memory storyTitle, string memory fullStoryTemplate) external onlyStoryManager returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(creator, tokenId);
        nftData[tokenId] = NFTData({
            storyId: storyId, storyTitle: storyTitle, wordPosition: 0, totalWords: 0,
            wordType: "", contributedWord: "", contributor: creator,
            contributionTimestamp: block.timestamp, storyComplete: true, revealed: true,
            isCreatorNFT: true, fullStoryTemplate: fullStoryTemplate
        });
        storyTokens[storyId].push(tokenId);
        return tokenId;
    }

    function revealStoryNFTs(string memory storyId) external onlyStoryManager {
        uint256[] memory tokenIds = storyTokens[storyId];
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            nftData[tokenId].storyComplete = true;
            nftData[tokenId].revealed = true;
            emit MetadataUpdate(tokenId);
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent");
        if (nftData[tokenId].revealed) {
            return string(abi.encodePacked(_revealedBaseURI, _toString(tokenId)));
        } else {
            return string(abi.encodePacked(_hiddenBaseURI, _toString(tokenId)));
        }
    }

    function getNFTData(uint256 tokenId) external view returns (NFTData memory) { return nftData[tokenId]; }
    function getStoryTokens(string memory storyId) external view returns (uint256[] memory) { return storyTokens[storyId]; }
    function checkContribution(string memory storyId, uint256 position, address contributor) external view returns (bool) { return hasContributed[storyId][position][contributor]; }
    function totalSupply() external view returns (uint256) { return _tokenIdCounter; }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) { digits--; buffer[digits] = bytes1(uint8(48 + uint256(value % 10))); value /= 10; }
        return string(buffer);
    }
}