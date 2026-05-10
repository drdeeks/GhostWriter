// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./GhostWriterNFT.sol";
import "./LiquidityPool.sol";
import "./PriceOracle.sol";

contract StoryManager is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    GhostWriterNFT public nftContract;
    LiquidityPool public liquidityPool;
    PriceOracle public priceOracle;

    uint256 public constant CONTRIBUTION_FEE_USD_CENTS = 5;
    uint256 public constant CREATION_FEE_USD_CENTS = 10;
    uint256 public maxActiveStories = 15;

    mapping(address => bool) public coAdmins;
    mapping(address => bool) public whitelisted;

    event MaxActiveStoriesUpdated(uint256 newMax);
    event StoryCreated(string indexed storyId, address indexed creator, StoryType storyType, uint256 totalSlots);
    event StoryCompleted(string indexed storyId, uint256 completedAt);
    event StoryTerminated(string indexed storyId, address indexed admin);
    event CoAdminSet(address indexed account, bool status);
    event WhitelistSet(address indexed account, bool status);

    uint256 public constant MINI_SLOTS_MIN = 5;
    uint256 public constant MINI_SLOTS_MAX = 10;
    uint256 public constant NORMAL_SLOTS_MIN = 10;
    uint256 public constant NORMAL_SLOTS_MAX = 20;
    uint256 public constant EPIC_SLOTS_MIN = 20;
    uint256 public constant EPIC_SLOTS_MAX = 35;

    enum StoryType { MINI, NORMAL, EPIC }
    enum StoryCategory { ADVENTURE, RANDOM }
    enum StoryStatus { ACTIVE, COMPLETE, TERMINATED }

    struct Story {
        string storyId;
        string title;
        string template;
        StoryType storyType;
        StoryCategory category;
        uint256 totalSlots;
        uint256 filledSlots;
        address creator;
        uint256 createdAt;
        uint256 completedAt;
        StoryStatus status;
        uint256 shareCount;
    }

    struct SlotDetail {
        uint256 position;
        string wordType;
        bool filled;
        string word;
        address contributor;
        uint256 nftId;
        uint256 timestamp;
    }

    struct UserStats {
        uint256 contributionsCount;
        uint256 creationCredits;
        uint256 storiesCreated;
        uint256 nftsOwned;
        uint256 completedStories;
        uint256 shareCount;
        uint256 lastContributionTime;
        string[] activeContributions;
    }

    mapping(string => Story) public stories;
    mapping(string => mapping(uint256 => SlotDetail)) public storySlots;
    mapping(address => UserStats) public userStats;
    mapping(string => bool) public storyExists;

    address public storyTemplateSigner;

    modifier onlyAdmin() {
        require(msg.sender == owner() || coAdmins[msg.sender], "Not an admin");
        _;
    }

    constructor(address _nftContract, address payable _liquidityPool, address _priceOracle) 
    Ownable(msg.sender) EIP712("GhostWriterStoryManager", "1") {
        nftContract = GhostWriterNFT(_nftContract);
        liquidityPool = LiquidityPool(_liquidityPool);
        priceOracle = PriceOracle(_priceOracle);
    }

    function setCoAdmin(address account, bool status) external onlyOwner {
        coAdmins[account] = status;
        emit CoAdminSet(account, status);
    }

    function setWhitelist(address account, bool status) external onlyAdmin {
        whitelisted[account] = status;
        emit WhitelistSet(account, status);
    }

    function getCreationFee() public view returns (uint256) {
        if (whitelisted[msg.sender]) return 0;
        return priceOracle.usdToEth(CREATION_FEE_USD_CENTS);
    }

    function getContributionFee() public view returns (uint256) {
        if (whitelisted[msg.sender]) return 0;
        return priceOracle.usdToEth(CONTRIBUTION_FEE_USD_CENTS);
    }

    function getActiveStoriesCount() public view returns (uint256) {
        return 0; 
    }

    function getTotalStories() external view returns (uint256) { return 0; }

    function finalizeStory(string memory storyId) external {
        nftContract.revealStoryNFTs(storyId);
    }
}