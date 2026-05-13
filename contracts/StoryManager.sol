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


    function getTotalStories() external view returns (uint256) { return 0; }

    function finalizeStory(string memory storyId) external {
        require(storyExists[storyId], "Story does not exist");
        require(stories[storyId].status == StoryStatus.COMPLETE, "Story not complete");
        require(stories[storyId].completedAt > 0, "Already finalized");

        stories[storyId].completedAt = 0;
        nftContract.revealStoryNFTs(storyId);
        nftContract.mintCreatorNFT(stories[storyId].creator, storyId, stories[storyId].title, stories[storyId].template);
    }

    function setStoryTemplateSigner(address _signer) external onlyAdmin {
        storyTemplateSigner = _signer;
    }

    function setMaxActiveStories(uint256 _max) external onlyAdmin {
        maxActiveStories = _max;
        emit MaxActiveStoriesUpdated(_max);
    }

    function airdropCredits(address[] calldata recipients, uint256[] calldata amounts) external onlyAdmin {
        require(recipients.length == amounts.length, "Array length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            userStats[recipients[i]].creationCredits += amounts[i];
        }
    }

    function createStory(
        string memory storyId,
        string memory title,
        string memory template,
        StoryType storyType,
        StoryCategory category,
        string[] memory wordTypes
    ) external payable {
        revert OwnableUnauthorizedAccount(msg.sender);
    }

    function createStoryApproved(
        string memory storyId,
        string memory title,
        string memory template,
        StoryType storyType,
        StoryCategory category,
        string[] memory wordTypes,
        uint256 expiresAt,
        bytes memory signature
    ) external payable nonReentrant {
        require(expiresAt >= block.timestamp, "Expired");
        bytes32 structHash = keccak256(abi.encode(
            keccak256("CreateStory(address creator,string storyId,string title,string template,uint8 storyType,uint8 category,bytes32 wordTypesHash,uint256 expiresAt)"),
            msg.sender,
            keccak256(bytes(storyId)),
            keccak256(bytes(title)),
            keccak256(bytes(template)),
            uint8(storyType),
            uint8(category),
            _hashWordTypes(wordTypes),
            expiresAt
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer == storyTemplateSigner, "Invalid signature");

        require(getActiveStoriesCount() < maxActiveStories);

        activeStories++;
        storyExists[storyId] = true;
        stories[storyId] = Story({
            storyId: storyId,
            title: title,
            template: template,
            storyType: storyType,
            category: category,
            totalSlots: wordTypes.length,
            filledSlots: 0,
            creator: msg.sender,
            createdAt: block.timestamp,
            completedAt: 0,
            status: StoryStatus.ACTIVE,
            shareCount: 0
        });
        userStats[msg.sender].storiesCreated++;
        for (uint256 i = 0; i < wordTypes.length; i++) {
            storySlots[storyId][i+1].wordType = wordTypes[i];
        }
    }

    function _hashWordTypes(string[] memory wordTypes) internal pure returns (bytes32) {
        bytes32 acc = bytes32(0);
        for (uint256 i = 0; i < wordTypes.length; i++) {
            acc = keccak256(abi.encodePacked(acc, keccak256(bytes(wordTypes[i]))));
        }
        return acc;
    }

    uint256 public activeStories;
    function getActiveStoriesCount() public view returns (uint256) {
        return activeStories;
    }

    function contributeWord(
        string memory storyId,
        uint256 position,
        string memory word
    ) external payable nonReentrant {
        require(storyExists[storyId], "Story does not exist");
        Story storage story = stories[storyId];
        require(story.status == StoryStatus.ACTIVE, "Not active");
        require(!storySlots[storyId][position].filled, "Already filled");

        storySlots[storyId][position].filled = true;
        storySlots[storyId][position].word = word;
        storySlots[storyId][position].contributor = msg.sender;
        story.filledSlots++;

        nftContract.mintHiddenNFT(msg.sender, storyId, story.title, position, story.totalSlots, storySlots[storyId][position].wordType, word);

        if (story.filledSlots == story.totalSlots) {
            story.status = StoryStatus.COMPLETE;
            story.completedAt = block.timestamp;
            nftContract.revealStoryNFTs(storyId);
        }
    }

    function forceCompleteStory(string memory storyId) external {
        if (msg.sender != owner()) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
        stories[storyId].status = StoryStatus.COMPLETE;
    }

    function getStory(string memory storyId) external view returns (Story memory) {
        return stories[storyId];
    }

    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }
}