// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GhostWriterNFT
 * @dev ERC-721 NFT contract for Ghost Writer game
 * Each NFT represents a word contribution to a story
 * NFTs start in "hidden" state and reveal when story completes
 */
contract GhostWriterNFT is ERC721, Ownable, ReentrancyGuard {
    // Token ID counter
    uint256 private _tokenIdCounter;

    // Struct to store NFT metadata
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
        string fullStoryTemplate; // For creator NFTs: complete madlib template
    }

    // Mapping from token ID to NFT data
    mapping(uint256 => NFTData) public nftData;

    // Mapping from storyId to array of token IDs
    mapping(string => uint256[]) public storyTokens;

    // Mapping to prevent duplicate contributions (storyId => position => contributor => hasMinted)
    mapping(string => mapping(uint256 => mapping(address => bool)))
        public hasContributed;

    // Base URIs for hidden and revealed states
    string private _hiddenBaseURI;
    string private _revealedBaseURI;

    // Only StoryManager can mint
    address public storyManager;

    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed contributor,
        string storyId,
        uint256 position
    );
    event CreatorNFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string storyId
    );
    event NFTRevealed(uint256 indexed tokenId, string word);
    event StoryCompleted(string indexed storyId, uint256[] tokenIds);
    event StoryManagerUpdated(address indexed newManager);
    event BaseURIUpdated(string hiddenURI, string revealedURI);

    modifier onlyStoryManager() {
        require(msg.sender == storyManager, "Only StoryManager can call");
        _;
    }

    constructor(
        string memory hiddenURI,
        string memory revealedURI
    ) ERC721("Ghost Writer NFT", "GHOST") Ownable(msg.sender) {
        require(bytes(hiddenURI).length > 0, "Invalid hidden URI");
        require(bytes(revealedURI).length > 0, "Invalid revealed URI");
        _hiddenBaseURI = hiddenURI;
        _revealedBaseURI = revealedURI;
    }

    /**
     * @dev Set the StoryManager contract address (only owner)
     */
    function setStoryManager(address _storyManager) external onlyOwner {
        require(_storyManager != address(0), "Invalid address");
        storyManager = _storyManager;
        emit StoryManagerUpdated(_storyManager);
    }

    /**
     * @dev Update base URIs (only owner)
     */
    function updateBaseURIs(
        string memory hiddenURI,
        string memory revealedURI
    ) external onlyOwner {
        _hiddenBaseURI = hiddenURI;
        _revealedBaseURI = revealedURI;
        emit BaseURIUpdated(hiddenURI, revealedURI);
    }

    /**
     * @dev Mint a new hidden NFT for a word contribution
     * Only callable by StoryManager
     * Enforces one mint per user per position per story
     */
    function mintHiddenNFT(
        address contributor,
        string memory storyId,
        string memory storyTitle,
        uint256 position,
        uint256 totalWords,
        string memory wordType,
        string memory word
    ) external onlyStoryManager nonReentrant returns (uint256) {
        require(contributor != address(0), "Invalid contributor");
        require(bytes(storyId).length > 0, "Invalid storyId");
        require(position > 0 && position <= totalWords, "Invalid position");
        require(
            !hasContributed[storyId][position][contributor],
            "Already contributed to this position"
        );

        // Mark as contributed
        hasContributed[storyId][position][contributor] = true;

        // Increment token ID
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Mint NFT
        _safeMint(contributor, tokenId);

        // Store NFT data (word is stored but not revealed)
        nftData[tokenId] = NFTData({
            storyId: storyId,
            storyTitle: storyTitle,
            wordPosition: position,
            totalWords: totalWords,
            wordType: wordType,
            contributedWord: word,
            contributor: contributor,
            contributionTimestamp: block.timestamp,
            storyComplete: false,
            revealed: false,
            isCreatorNFT: false,
            fullStoryTemplate: ""
        });

        // Add to story tokens
        storyTokens[storyId].push(tokenId);

        emit NFTMinted(tokenId, contributor, storyId, position);

        return tokenId;
    }

    /**
     * @dev Mint a creator NFT for the story creator
     * Contains the complete story template in Mad Libs format
     * Only callable by StoryManager when story is complete
     */
    function mintCreatorNFT(
        address creator,
        string memory storyId,
        string memory storyTitle,
        string memory fullStoryTemplate
    ) external onlyStoryManager nonReentrant returns (uint256) {
        require(creator != address(0), "Invalid creator");
        require(bytes(storyId).length > 0, "Invalid storyId");
        require(bytes(fullStoryTemplate).length > 0, "Invalid template");

        // Increment token ID
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Mint NFT to creator
        _safeMint(creator, tokenId);

        // Store NFT data (creator NFTs are always "revealed" - they show the template)
        nftData[tokenId] = NFTData({
            storyId: storyId,
            storyTitle: storyTitle,
            wordPosition: 0, // Not applicable for creator NFTs
            totalWords: 0, // Not applicable for creator NFTs
            wordType: "", // Not applicable for creator NFTs
            contributedWord: "", // Not applicable for creator NFTs
            contributor: creator,
            contributionTimestamp: block.timestamp,
            storyComplete: true, // Creator NFTs are always complete
            revealed: true, // Creator NFTs are always revealed
            isCreatorNFT: true,
            fullStoryTemplate: fullStoryTemplate
        });

        // Add to story tokens
        storyTokens[storyId].push(tokenId);

        emit CreatorNFTMinted(tokenId, creator, storyId);

        return tokenId;
    }

    /**
     * @dev Reveal all NFTs for a completed story
     * Only callable by StoryManager when story is complete
     */
    function revealStoryNFTs(
        string memory storyId
    ) external onlyStoryManager nonReentrant {
        uint256[] memory tokenIds = storyTokens[storyId];
        require(tokenIds.length > 0, "No NFTs for this story");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            NFTData storage data = nftData[tokenId];

            require(!data.revealed, "Story already revealed");

            data.storyComplete = true;
            data.revealed = true;

            emit NFTRevealed(tokenId, data.contributedWord);
        }

        emit StoryCompleted(storyId, tokenIds);
    }

    /**
     * @dev Get NFT metadata for a token
     */
    function getNFTData(
        uint256 tokenId
    ) external view returns (NFTData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return nftData[tokenId];
    }

    /**
     * @dev Get all token IDs for a story
     */
    function getStoryTokens(
        string memory storyId
    ) external view returns (uint256[] memory) {
        return storyTokens[storyId];
    }

    /**
     * @dev Check if user has contributed to a position
     */
    function checkContribution(
        string memory storyId,
        uint256 position,
        address contributor
    ) external view returns (bool) {
        return hasContributed[storyId][position][contributor];
    }

    /**
     * @dev Get total number of tokens minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Override tokenURI to return different URIs based on reveal state
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        NFTData memory data = nftData[tokenId];

        if (data.revealed) {
            return
                string(abi.encodePacked(_revealedBaseURI, _toString(tokenId)));
        } else {
            return string(abi.encodePacked(_hiddenBaseURI, _toString(tokenId)));
        }
    }

    /**
     * @dev Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
