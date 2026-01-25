// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./GhostWriterNFT.sol";
import "./LiquidityPool.sol";
import "./PriceOracle.sol";

/**
 * @title StoryManager
 * @dev Core game logic contract for Ghost Writer
 * Manages story creation, word contributions, and completion
 */
contract StoryManager is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    GhostWriterNFT public nftContract;
    LiquidityPool public liquidityPool;
    PriceOracle public priceOracle;
    
    // GHOST token address (set by owner after deployment)
    address public ghostToken;

    // Fee amounts in USD cents (5 cents and 10 cents)
    uint256 public constant CONTRIBUTION_FEE_USD_CENTS = 5;
    uint256 public constant CREATION_FEE_USD_CENTS = 10;

    // Slot count ranges (enterprise constraints)
    uint256 public constant MINI_SLOTS_MIN = 5;
    uint256 public constant MINI_SLOTS_MAX = 10;
    uint256 public constant NORMAL_SLOTS_MIN = 10;
    uint256 public constant NORMAL_SLOTS_MAX = 15;
    uint256 public constant EPIC_SLOTS_MIN = 15;
    uint256 public constant EPIC_SLOTS_MAX = 25;

    // Story types
    enum StoryType {
        MINI,
        NORMAL,
        EPIC
    }

    // Story categories (must stay in sync with frontend + story generator)
    enum StoryCategory {
        ADVENTURE,
        FANTASY,
        COMEDY,
        MYSTERY,
        SCIFI,
        HORROR,
        ROMANCE,
        CRYPTO,
        SPORTS,
        ANIMALS,
        SCHOOL,
        SUPERHEROES,
        FRIENDSHIP,
        HOLIDAYS,
        FOOD,
        NATURE,
        HISTORY,
        RANDOM
    }

    // Server-authorized signer for story template approvals (EIP-712)
    address public storyTemplateSigner;

    // Prevents multiple creator NFTs for a single story
    mapping(string => bool) public creatorNFTMinted;

    // EIP-712 typehash
    bytes32 private constant CREATE_STORY_TYPEHASH =
        keccak256(
            "CreateStory(address creator,string storyId,string title,string template,uint8 storyType,uint8 category,bytes32 wordTypesHash,uint256 expiresAt)"
        );

    // Valid word types (must match frontend)
    bytes32 private constant WT_ADJECTIVE = keccak256("adjective");
    bytes32 private constant WT_NOUN = keccak256("noun");
    bytes32 private constant WT_VERB = keccak256("verb");
    bytes32 private constant WT_ADVERB = keccak256("adverb");
    bytes32 private constant WT_PLURAL_NOUN = keccak256("plural_noun");
    bytes32 private constant WT_PAST_TENSE_VERB = keccak256("past_tense_verb");
    bytes32 private constant WT_VERB_ING = keccak256("verb_ing");
    bytes32 private constant WT_PERSONS_NAME = keccak256("persons_name");
    bytes32 private constant WT_PLACE = keccak256("place");
    bytes32 private constant WT_NUMBER = keccak256("number");
    bytes32 private constant WT_COLOR = keccak256("color");
    bytes32 private constant WT_BODY_PART = keccak256("body_part");
    bytes32 private constant WT_FOOD = keccak256("food");
    bytes32 private constant WT_ANIMAL = keccak256("animal");
    bytes32 private constant WT_EXCLAMATION = keccak256("exclamation");
    bytes32 private constant WT_EMOTION = keccak256("emotion");

    // Story status
    enum StoryStatus {
        ACTIVE,
        COMPLETE
    }

    // Story struct
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

    // Slot detail struct
    struct SlotDetail {
        uint256 position;
        string wordType;
        bool filled;
        string word;
        address contributor;
        uint256 nftId;
        uint256 timestamp;
    }

    // User stats struct
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

    // Achievement struct
    struct Achievement {
        string id;
        string name;
        string description;
        bool unlocked;
        uint256 unlockedAt;
    }

    // Leaderboard entry
    struct LeaderboardEntry {
        address user;
        uint256 contributions;
        uint256 rank;
    }

    // Mappings
    mapping(string => Story) public stories;
    mapping(string => mapping(uint256 => SlotDetail)) public storySlots;
    mapping(address => UserStats) public userStats;
    mapping(string => bool) public storyExists;
    mapping(string => mapping(address => bool))
        public storyCompletedContributors; // New mapping

    mapping(address => mapping(string => bool)) public hasContributedToStory;

    // Arrays for tracking
    string[] public allStoryIds;
    mapping(address => string[]) public userCreatedStories;
    mapping(StoryCategory => string[]) public storiesByCategory;

    // Leaderboard tracking (top 1000 only)
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardIndex;
    uint256 public constant MAX_LEADERBOARD_SIZE = 1000;

    // Achievements tracking
    mapping(address => mapping(string => Achievement)) public userAchievements;
    string[] public achievementIds;
    mapping(address => uint256) public achievementCount;

    // Pending refunds (pull-over-push pattern)
    mapping(address => uint256) public pendingRefunds;

    // Final word count tracking (for achievement)
    mapping(address => uint256) public finalWordCount;

    // Events
    event StoryCreated(
        string indexed storyId,
        address indexed creator,
        StoryType storyType,
        uint256 totalSlots
    );
    event WordContributed(
        string indexed storyId,
        uint256 position,
        address indexed contributor,
        uint256 nftId
    );
    event StoryCompleted(string indexed storyId, uint256 completedAt);
    event CreationCreditEarned(address indexed user, uint256 newTotal);
    event FeesCollected(uint256 amount, address indexed pool);
    event AchievementUnlocked(
        address indexed user,
        string achievementId,
        string name
    );
    event StoryShared(string indexed storyId, address indexed sharer);
    event LeaderboardUpdated(address indexed user, uint256 newRank);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);
    event StoryTemplateSignerUpdated(address indexed newSigner);
    event StoryFinalized(string indexed storyId, uint256 indexed creatorTokenId);
    event GhostTokenUpdated(address indexed newToken);

    constructor(
        address _nftContract,
        address payable _liquidityPool,
        address _priceOracle
    ) Ownable(msg.sender) EIP712("GhostWriterStoryManager", "1") {
        require(_nftContract != address(0));
        require(_liquidityPool != address(0));
        require(_priceOracle != address(0));
        nftContract = GhostWriterNFT(_nftContract);
        liquidityPool = LiquidityPool(_liquidityPool);
        priceOracle = PriceOracle(_priceOracle);
        _initializeAchievements();
    }

    /**
     * @dev Set the server-authorized signer for story template approvals
     */
    function setStoryTemplateSigner(address signer) external onlyOwner {
        require(signer != address(0));
        storyTemplateSigner = signer;
        emit StoryTemplateSignerUpdated(signer);
    }

    /**
     * @dev Set the GHOST token address (only owner)
     */
    function setGhostToken(address _ghostToken) external onlyOwner {
        require(_ghostToken != address(0));
        ghostToken = _ghostToken;
        emit GhostTokenUpdated(_ghostToken);
    }

    /**
     * @dev Get current contribution fee in ETH
     */
    function getContributionFee() public view returns (uint256) {
        return priceOracle.usdToEth(CONTRIBUTION_FEE_USD_CENTS);
    }

    /**
     * @dev Get current creation fee in ETH
     */
    function getCreationFee() public view returns (uint256) {
        return priceOracle.usdToEth(CREATION_FEE_USD_CENTS);
    }

    /**
     * @dev Initialize achievement definitions
     */
    function _initializeAchievements() internal {
        achievementIds.push("first_word");
        achievementIds.push("story_starter");
        achievementIds.push("completion_king");
        achievementIds.push("prolific_writer");
        achievementIds.push("speed_demon");
        achievementIds.push("night_owl");
    }

    function _requireLiquidityPoolInitialized() internal view {
        require(liquidityPool.storyManager() == address(this));
    }

    function _isValidWordType(string memory wordType) internal pure returns (bool) {
        bytes32 h = keccak256(bytes(wordType));
        return
            h == WT_ADJECTIVE ||
            h == WT_NOUN ||
            h == WT_VERB ||
            h == WT_ADVERB ||
            h == WT_PLURAL_NOUN ||
            h == WT_PAST_TENSE_VERB ||
            h == WT_VERB_ING ||
            h == WT_PERSONS_NAME ||
            h == WT_PLACE ||
            h == WT_NUMBER ||
            h == WT_COLOR ||
            h == WT_BODY_PART ||
            h == WT_FOOD ||
            h == WT_ANIMAL ||
            h == WT_EXCLAMATION ||
            h == WT_EMOTION;
    }

    function _hashWordTypes(string[] memory wordTypes) internal pure returns (bytes32) {
        bytes32 acc = bytes32(0);
        for (uint256 i = 0; i < wordTypes.length; i++) {
            acc = keccak256(abi.encodePacked(acc, keccak256(bytes(wordTypes[i]))));
        }
        return acc;
    }

    function _verifyCreateStorySignature(
        address creator,
        string memory storyId,
        string memory title,
        string memory template,
        StoryType storyType,
        StoryCategory category,
        string[] memory wordTypes,
        uint256 expiresAt,
        bytes calldata signature
    ) internal view {
        require(storyTemplateSigner != address(0));
        require(block.timestamp <= expiresAt);

        bytes32 wordTypesHash = _hashWordTypes(wordTypes);

        bytes32 structHash = keccak256(
            abi.encode(
                CREATE_STORY_TYPEHASH,
                creator,
                keccak256(bytes(storyId)),
                keccak256(bytes(title)),
                keccak256(bytes(template)),
                uint8(storyType),
                uint8(category),
                wordTypesHash,
                expiresAt
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        require(recovered == storyTemplateSigner);
    }

    function _createStoryInternal(
        string memory storyId,
        string memory title,
        string memory template,
        StoryType storyType,
        StoryCategory category,
        string[] memory wordTypes
    ) internal {
        _requireLiquidityPoolInitialized();

        uint256 requiredFee = getCreationFee();
        require(msg.value >= requiredFee);

        require(bytes(storyId).length > 0);
        require(!storyExists[storyId]);

        require(bytes(title).length > 0);
        require(bytes(title).length <= 100);

        require(bytes(template).length > 0);
        require(bytes(template).length <= 5000);

        require(userStats[msg.sender].creationCredits > 0);

        // Enforce a maximum of 15 active stories
        require(getActiveStoriesCount() < 15);

        uint256 totalSlots = wordTypes.length;
        if (storyType == StoryType.MINI) {
            require(totalSlots >= MINI_SLOTS_MIN && totalSlots <= MINI_SLOTS_MAX);
        } else if (storyType == StoryType.NORMAL) {
            require(totalSlots >= NORMAL_SLOTS_MIN && totalSlots <= NORMAL_SLOTS_MAX);
        } else {
            require(totalSlots >= EPIC_SLOTS_MIN && totalSlots <= EPIC_SLOTS_MAX);
        }

        // Validate story type
        if (storyType == StoryType.EPIC) {
            require(msg.sender == owner());
        }

        // Validate word types
        for (uint256 i = 0; i < totalSlots; i++) {
            require(bytes(wordTypes[i]).length > 0);
            require(bytes(wordTypes[i]).length <= 32);
            require(_isValidWordType(wordTypes[i]));
        }

        // Create story
        stories[storyId] = Story({
            storyId: storyId,
            title: title,
            template: template,
            storyType: storyType,
            category: category,
            totalSlots: totalSlots,
            filledSlots: 0,
            creator: msg.sender,
            createdAt: block.timestamp,
            completedAt: 0,
            status: StoryStatus.ACTIVE,
            shareCount: 0
        });

        // Initialize slots
        for (uint256 i = 0; i < totalSlots; i++) {
            storySlots[storyId][i + 1] = SlotDetail({
                position: i + 1,
                wordType: wordTypes[i],
                filled: false,
                word: "",
                contributor: address(0),
                nftId: 0,
                timestamp: 0
            });
        }

        storyExists[storyId] = true;
        allStoryIds.push(storyId);
        userCreatedStories[msg.sender].push(storyId);
        storiesByCategory[category].push(storyId);

        // Consume creation credit
        userStats[msg.sender].creationCredits--;
        userStats[msg.sender].storiesCreated++;

        // Check for story starter achievement
        if (userStats[msg.sender].storiesCreated == 1) {
            _unlockAchievement(
                msg.sender,
                "story_starter",
                "Story Starter",
                "Created your first story"
            );
        }

        // Forward fee to liquidity pool
        liquidityPool.deposit{value: requiredFee}();

        // Store refund for pull withdrawal
        uint256 refundAmount = msg.value - requiredFee;
        if (refundAmount > 0) {
            pendingRefunds[msg.sender] += refundAmount;
        }

        emit FeesCollected(requiredFee, address(liquidityPool));
        emit StoryCreated(storyId, msg.sender, storyType, totalSlots);
    }

    /**
     * @dev Owner-only backdoor for story creation (custom templates)
     * Enterprise enforcement: normal users must use `createStoryApproved`.
     */
    function createStory(
        string memory storyId,
        string memory title,
        string memory template,
        StoryType storyType,
        StoryCategory category,
        string[] memory wordTypes
    ) external payable nonReentrant onlyOwner {
        _createStoryInternal(storyId, title, template, storyType, category, wordTypes);
    }

    /**
     * @dev Create a story using a server-signed (EIP-712) approval.
     * Prevents custom user stories by enforcing an allowlisted signer.
     */
    function createStoryApproved(
        string memory storyId,
        string memory title,
        string memory template,
        StoryType storyType,
        StoryCategory category,
        string[] memory wordTypes,
        uint256 expiresAt,
        bytes calldata signature
    ) external payable nonReentrant {
        _verifyCreateStorySignature(
            msg.sender,
            storyId,
            title,
            template,
            storyType,
            category,
            wordTypes,
            expiresAt,
            signature
        );

        _createStoryInternal(storyId, title, template, storyType, category, wordTypes);
    }

    /**
     * @dev Returns the number of active stories
     */
    function getActiveStoriesCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allStoryIds.length; i++) {
            if (stories[allStoryIds[i]].status == StoryStatus.ACTIVE) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Contribute a word to a story
     * Mints an NFT and awards creation credit
     */
    function contributeWord(
        string memory storyId,
        uint256 position,
        string memory word
    ) external payable nonReentrant {
        uint256 requiredFee = getContributionFee();
        require(msg.value >= requiredFee);
        require(storyExists[storyId]);

        Story storage story = stories[storyId];
        require(story.status == StoryStatus.ACTIVE);
        require(position > 0 && position <= story.totalSlots);

        SlotDetail storage slot = storySlots[storyId][position];
        require(!slot.filled);
        require(bytes(word).length >= 3);
        require(bytes(word).length <= 30);

        // Check if user already contributed to this position
        require(!nftContract.checkContribution(storyId, position, msg.sender));

        // Mint hidden NFT
        uint256 nftId = nftContract.mintHiddenNFT(
            msg.sender,
            storyId,
            story.title,
            position,
            story.totalSlots,
            slot.wordType,
            word
        );

        // Update slot
        slot.filled = true;
        slot.word = word;
        slot.contributor = msg.sender;
        slot.nftId = nftId;
        slot.timestamp = block.timestamp;

        // Update story
        story.filledSlots++;

        // Update user stats
        userStats[msg.sender].contributionsCount++;
        userStats[msg.sender].creationCredits++; // Award creation credit
        userStats[msg.sender].nftsOwned++;
        userStats[msg.sender].lastContributionTime = block.timestamp;

        // Add story to user's active contributions if not already present
        if (!hasContributedToStory[msg.sender][storyId]) {
            userStats[msg.sender].activeContributions.push(storyId);
            hasContributedToStory[msg.sender][storyId] = true;
        }

        // Update leaderboard
        _updateLeaderboard(msg.sender);

        // Check for first word achievement
        if (userStats[msg.sender].contributionsCount == 1) {
            _unlockAchievement(
                msg.sender,
                "first_word",
                "First Word",
                "Contributed your first word"
            );
        }

        // Check for prolific writer achievement (50+ contributions)
        if (userStats[msg.sender].contributionsCount == 50) {
            _unlockAchievement(
                msg.sender,
                "prolific_writer",
                "Prolific Writer",
                "Contributed to 50+ stories"
            );
        }

        // Check for night owl achievement (contributed between 12am-6am)
        uint256 hour = (block.timestamp / 3600) % 24;
        if (
            hour >= 0 &&
            hour < 6 &&
            !userAchievements[msg.sender]["night_owl"].unlocked
        ) {
            _unlockAchievement(
                msg.sender,
                "night_owl",
                "Night Owl",
                "Contributed between 12am-6am"
            );
        }

        _requireLiquidityPoolInitialized();

        // Forward fee to liquidity pool
        liquidityPool.deposit{value: requiredFee}();

        // Store refund for pull withdrawal
        uint256 refundAmount = msg.value - requiredFee;
        if (refundAmount > 0) {
            pendingRefunds[msg.sender] += refundAmount;
        }

        emit FeesCollected(requiredFee, address(liquidityPool));

        emit WordContributed(storyId, position, msg.sender, nftId);
        emit CreationCreditEarned(
            msg.sender,
            userStats[msg.sender].creationCredits
        );

        // Check if story is complete
        if (story.filledSlots >= story.totalSlots) {
            _completeStory(storyId);
        }
    }

    /**
     * @dev Internal function to complete a story
     * Marks story as complete and emits event for off-chain processing
     */
    function _completeStory(string memory storyId) internal {
        Story storage story = stories[storyId];
        require(story.status == StoryStatus.ACTIVE);
        story.status = StoryStatus.COMPLETE;
        story.completedAt = block.timestamp;

        // Check for speed demon achievement (completed in < 24 hours)
        uint256 timeTaken = block.timestamp - story.createdAt;
        if (
            timeTaken < 24 hours &&
            !userAchievements[story.creator]["speed_demon"].unlocked
        ) {
            _unlockAchievement(
                story.creator,
                "speed_demon",
                "Speed Demon",
                "Story completed in <24 hours"
            );
        }

        // Auto-reveal contributor NFTs immediately when the story completes
        nftContract.revealStoryNFTs(storyId);

        emit StoryCompleted(storyId, block.timestamp);
    }

    /**
     * @dev Process story completion in batches (callable by anyone after completion)
     * Updates contributor stats and checks achievements
     */
    function processCompletionBatch(
        string memory storyId,
        uint256 startPosition,
        uint256 endPosition
    ) external nonReentrant {
        Story storage story = stories[storyId];
        require(story.status == StoryStatus.COMPLETE);
        require(startPosition > 0 && startPosition <= story.totalSlots);
        require(endPosition >= startPosition && endPosition <= story.totalSlots);
        require(endPosition - startPosition < 50);

        for (uint256 i = startPosition; i <= endPosition; i++) {
            address contributor = storySlots[storyId][i].contributor;

            if (
                contributor != address(0) &&
                !storyCompletedContributors[storyId][contributor]
            ) {
                userStats[contributor].completedStories++;
                storyCompletedContributors[storyId][contributor] = true;
            }

            // Track final word count for achievement
            if (i == story.totalSlots && contributor != address(0)) {
                finalWordCount[contributor]++;
                
                if (
                    finalWordCount[contributor] >= 5 &&
                    !userAchievements[contributor]["completion_king"].unlocked
                ) {
                    _unlockAchievement(
                        contributor,
                        "completion_king",
                        "Completion King",
                        "Contributed the final word to 5 stories"
                    );
                }
            }
        }
    }

    /**
     * @dev Reveal NFTs and mint creator NFT (callable after completion processing)
     */
    function finalizeStory(string memory storyId) external nonReentrant {
        Story storage story = stories[storyId];
        require(story.status == StoryStatus.COMPLETE);
        require(!creatorNFTMinted[storyId]);

        // Reveal all contributor NFTs (safe/idempotent)
        nftContract.revealStoryNFTs(storyId);

        // Mint creator NFT (single-shot)
        uint256 creatorTokenId = nftContract.mintCreatorNFT(
            story.creator,
            storyId,
            story.title,
            story.template
        );

        creatorNFTMinted[storyId] = true;
        emit StoryFinalized(storyId, creatorTokenId);
    }

    /**
     * @dev Update leaderboard with user's contribution count
     * Simplified to avoid gas-intensive sorting
     */
    function _updateLeaderboard(address user) internal {
        uint256 userContributions = userStats[user].contributionsCount;

        // If user not in leaderboard and leaderboard has space
        if (
            leaderboardIndex[user] == 0 &&
            leaderboard.length < MAX_LEADERBOARD_SIZE
        ) {
            leaderboard.push(user);
            leaderboardIndex[user] = leaderboard.length;
            emit LeaderboardUpdated(user, leaderboard.length);
            return;
        }

        // If leaderboard is full, check if user should replace lowest
        if (
            leaderboard.length >= MAX_LEADERBOARD_SIZE &&
            leaderboardIndex[user] == 0
        ) {
            address lowestUser = leaderboard[leaderboard.length - 1];
            uint256 lowestContributions = userStats[lowestUser].contributionsCount;

            if (userContributions > lowestContributions) {
                delete leaderboardIndex[lowestUser];
                leaderboard[leaderboard.length - 1] = user;
                leaderboardIndex[user] = leaderboard.length;
                emit LeaderboardUpdated(user, leaderboard.length);
            }
        }

        // Emit event for off-chain sorting
        if (leaderboardIndex[user] > 0) {
            emit LeaderboardUpdated(user, leaderboardIndex[user]);
        }
    }

    /**
     * @dev Unlock an achievement for a user
     */
    function _unlockAchievement(
        address user,
        string memory achievementId,
        string memory name,
        string memory description
    ) internal {
        if (!userAchievements[user][achievementId].unlocked) {
            userAchievements[user][achievementId] = Achievement({
                id: achievementId,
                name: name,
                description: description,
                unlocked: true,
                unlockedAt: block.timestamp
            });
            achievementCount[user]++;
            emit AchievementUnlocked(user, achievementId, name);
        }
    }

    /**
     * @dev Share a story (tracks social sharing)
     */
    function shareStory(string memory storyId) external {
        require(storyExists[storyId]);
        Story storage story = stories[storyId];
        require(story.status == StoryStatus.COMPLETE);

        story.shareCount++;
        userStats[msg.sender].shareCount++;

        emit StoryShared(storyId, msg.sender);
    }

    /**
     * @dev Get story details
     */
    function getStory(
        string memory storyId
    ) external view returns (Story memory) {
        require(storyExists[storyId]);
        return stories[storyId];
    }

    /**
     * @dev Get slot details for a story
     */
    function getSlot(
        string memory storyId,
        uint256 position
    ) external view returns (SlotDetail memory) {
        require(storyExists[storyId]);
        return storySlots[storyId][position];
    }

    /**
     * @dev Get user statistics
     */
    function getUserStats(
        address user
    ) external view returns (UserStats memory) {
        return userStats[user];
    }

    /**
     * @dev Get all story IDs
     */
    function getAllStoryIds() external view returns (string[] memory) {
        return allStoryIds;
    }

    /**
     * @dev Get stories created by user
     */
    function getUserCreatedStories(
        address user
    ) external view returns (string[] memory) {
        return userCreatedStories[user];
    }

    /**
     * @dev Get total number of stories
     */
    function getTotalStories() external view returns (uint256) {
        return allStoryIds.length;
    }

    /**
     * @dev Get leaderboard (top 1000)
     */
    function getLeaderboard(
        uint256 offset,
        uint256 limit
    ) external view returns (LeaderboardEntry[] memory) {
        require(limit <= 100);
        require(offset < leaderboard.length);

        uint256 end = offset + limit;
        if (end > leaderboard.length) {
            end = leaderboard.length;
        }

        uint256 resultLength = end > offset ? end - offset : 0;
        LeaderboardEntry[] memory entries = new LeaderboardEntry[](
            resultLength
        );

        for (uint256 i = 0; i < resultLength; i++) {
            address user = leaderboard[offset + i];
            entries[i] = LeaderboardEntry({
                user: user,
                contributions: userStats[user].contributionsCount,
                rank: offset + i + 1
            });
        }

        return entries;
    }

    /**
     * @dev Get user achievements
     */
    function getUserAchievements(
        address user
    ) external view returns (Achievement[] memory) {
        Achievement[] memory achievements = new Achievement[](
            achievementIds.length
        );

        for (uint256 i = 0; i < achievementIds.length; i++) {
            achievements[i] = userAchievements[user][achievementIds[i]];
        }

        return achievements;
    }

    /**
     * @dev Get stories by category
     */
    function getStoriesByCategory(
        StoryCategory category
    ) external view returns (string[] memory) {
        return storiesByCategory[category];
    }

    /**
     * @dev Get user rank on leaderboard
     */
    function getUserRank(address user) external view returns (uint256) {
        return leaderboardIndex[user];
    }

    /**
     * @dev Owner can airdrop creation credits to users
     */
    function airdropCredits(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(users.length == amounts.length);
        for (uint256 i = 0; i < users.length; i++) {
            userStats[users[i]].creationCredits += amounts[i];
            emit CreationCreditEarned(
                users[i],
                userStats[users[i]].creationCredits
            );
        }
    }

    /**
     * @dev Owner can update price oracle
     */
    function updatePriceOracle(address _priceOracle) external onlyOwner {
        require(_priceOracle != address(0));
        priceOracle = PriceOracle(_priceOracle);
        emit PriceOracleUpdated(_priceOracle);
    }

    event PriceOracleUpdated(address indexed newOracle);

    /**
     * @dev Withdraw pending refund (pull pattern)
     */
    function withdrawRefund() external nonReentrant {
        uint256 amount = pendingRefunds[msg.sender];
        require(amount > 0);
        
        pendingRefunds[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success);
        
        emit RefundWithdrawn(msg.sender, amount);
    }

    event RefundWithdrawn(address indexed user, uint256 amount);

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0);
        
        // Bug #34 fix: Use call instead of transfer
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success);
        
        emit EmergencyWithdrawal(owner(), balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
