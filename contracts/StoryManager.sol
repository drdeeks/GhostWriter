// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GhostWriterNFT.sol";
import "./LiquidityPool.sol";

/**
 * @title StoryManager
 * @dev Core game logic contract for Ghost Writer
 * Manages story creation, word contributions, and completion
 */
contract StoryManager is Ownable, ReentrancyGuard {
    GhostWriterNFT public nftContract;
    LiquidityPool public liquidityPool;

    // Fee amounts in wei
    uint256 public constant CONTRIBUTION_FEE = 0.00005 ether; // $0.05 equivalent (adjust based on ETH price)
    uint256 public constant CREATION_FEE = 0.0001 ether; // $0.10 equivalent (adjust based on ETH price)

    // Story types
    enum StoryType {
        MINI,
        NORMAL,
        EPIC
    }

    // Story categories
    enum StoryCategory {
        FANTASY,
        SCIFI,
        COMEDY,
        HORROR,
        ADVENTURE,
        MYSTERY,
        ROMANCE,
        CRYPTO,
        RANDOM
    }

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
    mapping(string => mapping(address => bool)) public storyCompletedContributors; // New mapping

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
    event AchievementUnlocked(address indexed user, string achievementId, string name);
    event StoryShared(string indexed storyId, address indexed sharer);
    event LeaderboardUpdated(address indexed user, uint256 newRank);

    constructor(
        address _nftContract,
        address payable _liquidityPool
    ) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract");
        require(_liquidityPool != address(0), "Invalid pool");
        nftContract = GhostWriterNFT(_nftContract);
        liquidityPool = LiquidityPool(_liquidityPool);
        _initializeAchievements();
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

    /**
     * @dev Create a new story
     * Requires creation fee and at least 1 creation credit
     */
    function createStory(
        string memory storyId,
        string memory title,
        string memory template,
        StoryType storyType,
        StoryCategory category,
        string[] memory wordTypes
    ) external payable nonReentrant {
        require(msg.value == CREATION_FEE, "Incorrect creation fee");
        require(bytes(storyId).length > 0, "Invalid storyId");
        require(!storyExists[storyId], "Story already exists");
        require(
            userStats[msg.sender].creationCredits > 0,
            "Need creation credits"
        );

        uint256 totalSlots = wordTypes.length;
        require(totalSlots > 0, "Need at least one slot");

        // Validate story type
        if (storyType == StoryType.MINI) {
            require(totalSlots <= 10, "Mini stories max 10 slots");
        } else if (storyType == StoryType.NORMAL) {
            require(totalSlots <= 20, "Normal stories max 20 slots");
        } else if (storyType == StoryType.EPIC) {
            require(totalSlots <= 200, "Epic stories max 200 slots");
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
            _unlockAchievement(msg.sender, "story_starter", "Story Starter", "Created your first story");
        }

        // Forward fee to liquidity pool
        liquidityPool.deposit{value: msg.value}();
        emit FeesCollected(msg.value, address(liquidityPool));

        emit StoryCreated(storyId, msg.sender, storyType, totalSlots);
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
        require(msg.value == CONTRIBUTION_FEE, "Incorrect contribution fee");
        require(storyExists[storyId], "Story does not exist");
        
        Story storage story = stories[storyId];
        require(story.status == StoryStatus.ACTIVE, "Story not active");
        require(position > 0 && position <= story.totalSlots, "Invalid position");

        SlotDetail storage slot = storySlots[storyId][position];
        require(!slot.filled, "Slot already filled");
        require(bytes(word).length >= 3, "Word too short");
        require(bytes(word).length <= 30, "Word too long");

        // Check if user already contributed to this position
        require(
            !nftContract.checkContribution(storyId, position, msg.sender),
            "Already contributed to this position"
        );

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
        
        // Update leaderboard
        _updateLeaderboard(msg.sender);
        
        // Check for first word achievement
        if (userStats[msg.sender].contributionsCount == 1) {
            _unlockAchievement(msg.sender, "first_word", "First Word", "Contributed your first word");
        }
        
        // Check for prolific writer achievement (50+ contributions)
        if (userStats[msg.sender].contributionsCount == 50) {
            _unlockAchievement(msg.sender, "prolific_writer", "Prolific Writer", "Contributed to 50+ stories");
        }
        
        // Check for night owl achievement (contributed between 12am-6am)
        uint256 hour = (block.timestamp / 3600) % 24;
        if (hour >= 0 && hour < 6 && !userAchievements[msg.sender]["night_owl"].unlocked) {
            _unlockAchievement(msg.sender, "night_owl", "Night Owl", "Contributed between 12am-6am");
        }

        // Forward fee to liquidity pool
        liquidityPool.deposit{value: msg.value}();
        emit FeesCollected(msg.value, address(liquidityPool));

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
     * Reveals all NFTs for the story
     */
    function _completeStory(string memory storyId) internal {
        Story storage story = stories[storyId];
        story.status = StoryStatus.COMPLETE;
        story.completedAt = block.timestamp;

                                // Update completed stories count for all contributors

                                for (uint256 i = 1; i <= story.totalSlots; i++) {

                                    address contributor = storySlots[storyId][i].contributor;

                                    if (contributor != address(0) && !storyCompletedContributors[storyId][contributor]) {

                                        userStats[contributor].completedStories++;

                                        storyCompletedContributors[storyId][contributor] = true; // Mark as counted

                                    }

                            

                                    // Check for completion king achievement (contributed final word to 5 stories)

                                    if (i == story.totalSlots) {

                                        uint256 finalWordCount = 0;

                                        for (uint256 j = 0; j < allStoryIds.length; j++) {

                                            Story memory s = stories[allStoryIds[j]];

                                            if (s.status == StoryStatus.COMPLETE &&

                                                storySlots[allStoryIds[j]][s.totalSlots].contributor == contributor) {

                                                finalWordCount++;

                                            }

                                        }

                                        if (finalWordCount >= 5 && !userAchievements[contributor]["completion_king"].unlocked) {

                                            _unlockAchievement(contributor, "completion_king", "Completion King", "Contributed the final word to 5 stories");

                                        }

                                    }

                                }        // Check for speed demon achievement (completed in < 24 hours)
        uint256 timeTaken = block.timestamp - story.createdAt;
        if (timeTaken < 24 hours && !userAchievements[story.creator]["speed_demon"].unlocked) {
            _unlockAchievement(story.creator, "speed_demon", "Speed Demon", "Story completed in <24 hours");
        }

        // Reveal all NFTs
        nftContract.revealStoryNFTs(storyId);

        emit StoryCompleted(storyId, block.timestamp);
    }

    /**
     * @dev Update leaderboard with user's contribution count
     */
    function _updateLeaderboard(address user) internal {
        uint256 userContributions = userStats[user].contributionsCount;
        
        // If user not in leaderboard and leaderboard has space
        if (leaderboardIndex[user] == 0 && leaderboard.length < MAX_LEADERBOARD_SIZE) {
            leaderboard.push(user);
            leaderboardIndex[user] = leaderboard.length;
            emit LeaderboardUpdated(user, leaderboard.length);
            return;
        }
        
        // If leaderboard is full, check if user should replace lowest
        if (leaderboard.length >= MAX_LEADERBOARD_SIZE) {
            address lowestUser = leaderboard[leaderboard.length - 1];
            uint256 lowestContributions = userStats[lowestUser].contributionsCount;
            
            if (userContributions > lowestContributions && leaderboardIndex[user] == 0) {
                // Replace lowest with new user
                delete leaderboardIndex[lowestUser];
                leaderboard[leaderboard.length - 1] = user;
                leaderboardIndex[user] = leaderboard.length;
            }
        }
        
        // Bubble up if needed (simplified - in production use more efficient sorting)
        uint256 currentIndex = leaderboardIndex[user];
        if (currentIndex > 0) {
            for (uint256 i = currentIndex - 1; i > 0; i--) {
                if (userStats[leaderboard[i - 1]].contributionsCount < userContributions) {
                    // Swap
                    address temp = leaderboard[i - 1];
                    leaderboard[i - 1] = user;
                    leaderboard[i] = temp;
                    leaderboardIndex[user] = i;
                    leaderboardIndex[temp] = i + 1;
                    emit LeaderboardUpdated(user, i);
                } else {
                    break;
                }
            }
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
        require(storyExists[storyId], "Story does not exist");
        Story storage story = stories[storyId];
        require(story.status == StoryStatus.COMPLETE, "Can only share completed stories");
        
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
        require(storyExists[storyId], "Story does not exist");
        return stories[storyId];
    }

    /**
     * @dev Get slot details for a story
     */
    function getSlot(
        string memory storyId,
        uint256 position
    ) external view returns (SlotDetail memory) {
        require(storyExists[storyId], "Story does not exist");
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
    function getLeaderboard(uint256 offset, uint256 limit) external view returns (LeaderboardEntry[] memory) {
        require(limit <= 100, "Max 100 entries per request");
        
        uint256 end = offset + limit;
        if (end > leaderboard.length) {
            end = leaderboard.length;
        }
        
        uint256 resultLength = end > offset ? end - offset : 0;
        LeaderboardEntry[] memory entries = new LeaderboardEntry[](resultLength);
        
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
    function getUserAchievements(address user) external view returns (Achievement[] memory) {
        Achievement[] memory achievements = new Achievement[](achievementIds.length);
        
        for (uint256 i = 0; i < achievementIds.length; i++) {
            achievements[i] = userAchievements[user][achievementIds[i]];
        }
        
        return achievements;
    }

    /**
     * @dev Get stories by category
     */
    function getStoriesByCategory(StoryCategory category) external view returns (string[] memory) {
        return storiesByCategory[category];
    }

    /**
     * @dev Get user rank on leaderboard
     */
    function getUserRank(address user) external view returns (uint256) {
        uint256 index = leaderboardIndex[user];
        return index > 0 ? index : 0; // 0 means not on leaderboard
    }

    /**
     * @dev Owner can airdrop creation credits to users
     */
    function airdropCredits(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "Mismatched arrays");
        for (uint256 i = 0; i < users.length; i++) {
            userStats[users[i]].creationCredits += amounts[i];
            emit CreationCreditEarned(users[i], userStats[users[i]].creationCredits);
        }
    }

    /**
     * @dev Owner can update fee amounts (emergency only)
     */
    function updateFees(
        uint256 newContributionFee,
        uint256 newCreationFee
    ) external onlyOwner {
        // Note: In production, use a more sophisticated fee oracle
        // This is a simplified version
        require(newContributionFee > 0, "Fee must be positive");
        require(newCreationFee > 0, "Fee must be positive");
        // Would update constant-like storage variables if made non-constant
        // For this implementation, fees are hardcoded as constants
        revert("Fee updates not supported in this version");
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
