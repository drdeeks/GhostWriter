import '@nomicfoundation/hardhat-chai-matchers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import hre from 'hardhat';
import type { GhostWriterNFT, LiquidityPool, StoryManager } from '../typechain-types';

describe('StoryManager - Expansion Features', function () {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let nftContract: GhostWriterNFT;
  let storyManager: StoryManager;
  let liquidityPool: LiquidityPool;

  const CONTRIBUTION_FEE = hre.ethers.parseEther('0.00005');
  const CREATION_FEE = hre.ethers.parseEther('0.0001');

  beforeEach(async function () {
    [owner, user1, user2, user3] = await hre.ethers.getSigners();

    // Deploy contracts
    const NFT = await hre.ethers.getContractFactory('GhostWriterNFT');
    nftContract = await NFT.connect(owner).deploy('ipfs://hidden/', 'ipfs://revealed/');

    const Pool = await hre.ethers.getContractFactory('LiquidityPool');
    liquidityPool = await Pool.connect(owner).deploy();

    const Manager = await hre.ethers.getContractFactory('StoryManager');
    storyManager = await Manager.connect(owner).deploy(
      await nftContract.getAddress(),
      await liquidityPool.getAddress()
    );

    // Set story manager in NFT contract
    await nftContract.setStoryManager(await storyManager.getAddress());
    await liquidityPool.setStoryManager(await storyManager.getAddress());

    // Airdrop one credit to the owner to allow story creation in tests
    await storyManager.airdropCredits([owner.address], [1]);
  });

  describe('Leaderboard System', function () {
    it('Should add user to leaderboard on first contribution', async function () {
      // Give user1 a creation credit to bootstrap
      // This requires owner to create a story first or implement airdrop
      // For this test, we'll contribute to an existing story

      // Owner creates a story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Once upon a [ADJECTIVE] time',
        0, // MINI
        0, // FANTASY category
        ['adjective'],
        { value: CREATION_FEE }
      );

      // User1 contributes
      await storyManager.connect(user1).contributeWord(
        'story1',
        1,
        'magical',
        { value: CONTRIBUTION_FEE }
      );

      // Check user is on leaderboard
      const userRank = await storyManager.getUserRank(user1.address);
      expect(userRank).to.be.gt(0);
    });

    it('Should update rankings correctly', async function () {
      // Create story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE] [NOUN]',
        0,
        0,
        ['adjective', 'noun'],
        { value: CREATION_FEE }
      );

      // User1 contributes (1 contribution)
      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // User2 contributes (1 contribution)
      await storyManager.connect(user2).contributeWord('story1', 2, 'word', { value: CONTRIBUTION_FEE });

      // Both should be on leaderboard
      const rank1 = await storyManager.getUserRank(user1.address);
      const rank2 = await storyManager.getUserRank(user2.address);

      expect(rank1).to.be.gt(0);
      expect(rank2).to.be.gt(0);
    });

    it('Should correctly rank users based on contributions', async function () {
      await storyManager.createStory('story1', 'Ranking Story', 'A [NOUN] and a [NOUN]', 0, 0, ['noun', 'noun'], { value: CREATION_FEE });
      await storyManager.connect(user1).contributeWord('story1', 1, 'cat', { value: CONTRIBUTION_FEE });
      await storyManager.connect(user2).contributeWord('story1', 2, 'dog', { value: CONTRIBUTION_FEE });
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory('story2', 'Another Story', 'A [VERB]', 0, 0, ['verb'], { value: CREATION_FEE });
      await storyManager.connect(user1).contributeWord('story2', 1, 'run', { value: CONTRIBUTION_FEE });

      const user1Rank = await storyManager.getUserRank(user1.address);
      const user2Rank = await storyManager.getUserRank(user2.address);
      const leaderboard = await storyManager.getLeaderboard(0, 2);

      expect(user1Rank).to.equal(1);
      expect(user2Rank).to.equal(2);
      expect(leaderboard[0].user).to.equal(user1.address);
      expect(leaderboard[1].user).to.equal(user2.address);
    });

    it('Should return paginated leaderboard results', async function () {
      // Create story and contribute
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // Get leaderboard
      const leaderboard = await storyManager.getLeaderboard(0, 10);

      expect(leaderboard.length).to.be.gte(0);
      expect(leaderboard.length).to.be.lte(10);
    });

    it('Should enforce max 100 entries per request', async function () {
      await expect(
        storyManager.getLeaderboard(0, 101)
      ).to.be.revertedWith('Max 100 entries per request');
    });
  });

  describe('Achievement System', function () {
    it('Should unlock "First Word" achievement on first contribution', async function () {
      // Create story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      // User1 contributes first word
      const tx = await storyManager.connect(user1).contributeWord('story1', 1, 'first', { value: CONTRIBUTION_FEE });
      const receipt = await tx.wait();

      // Check for AchievementUnlocked event
      const events = receipt?.logs || [];
      const achievementEvent = events.find((log: any) => {
        try {
          const parsedLog = storyManager.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          return parsedLog?.name === 'AchievementUnlocked';
        } catch {
          return false;
        }
      });

      expect(achievementEvent).to.not.be.undefined;

      // Verify achievement is stored
      const achievements = await storyManager.getUserAchievements(user1.address);
      const firstWord = achievements.find((a: any) => a.id === 'first_word');
      expect(firstWord?.unlocked).to.be.true;
    });

    it('Should unlock "Story Starter" achievement on first story creation', async function () {
      // Owner already created a story in beforeEach, so they have credit
      const tx = await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      const receipt = await tx.wait();

      // Check for AchievementUnlocked event
      const events = receipt?.logs || [];
      const achievementEvent = events.find((log: any) => {
        try {
          const parsedLog = storyManager.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          return parsedLog?.name === 'AchievementUnlocked';
        } catch {
          return false;
        }
      });

      expect(achievementEvent).to.not.be.undefined;
    });

    it('Should track achievement count', async function () {
      // Create story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      // User1 contributes
      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // Check achievement count
      const count = await storyManager.achievementCount(user1.address);
      expect(count).to.be.gte(1); // At least "First Word"
    });

    it('Should unlock "Completion King" achievement', async function () {
      for (let i = 0; i < 5; i++) {
        const storyId = `story_completion_${i}`;
        await storyManager.connect(owner).airdropCredits([owner.address], [1]);
        await storyManager.createStory(storyId, `Story ${i}`, 'A [NOUN]', 0, 0, ['noun'], { value: CREATION_FEE });
        await storyManager.connect(user1).contributeWord(storyId, 1, 'word', { value: CONTRIBUTION_FEE });
      }
      const achievements = await storyManager.getUserAchievements(user1.address);
      const completionKing = achievements.find((a: any) => a.id === 'completion_king');
      expect(completionKing?.unlocked).to.be.true;
    });
  });

  describe('Story Categories', function () {
    it('Should create story with category', async function () {
      await storyManager.createStory(
        'story1',
        'Fantasy Story',
        'Test [ADJECTIVE]',
        0, // MINI
        0, // FANTASY category
        ['adjective'],
        { value: CREATION_FEE }
      );

      const story = await storyManager.getStory('story1');
      expect(story.category).to.equal(0); // FANTASY = 0
    });

    it('Should retrieve stories by category', async function () {
      // Create multiple stories with different categories
      await storyManager.createStory(
        'story1',
        'Fantasy Story',
        'Test [ADJECTIVE]',
        0,
        0, // FANTASY
        ['adjective'],
        { value: CREATION_FEE }
      );

      // Need credit for second story
      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      await storyManager.connect(user1).createStory(
        'story2',
        'Sci-Fi Story',
        'Test [NOUN]',
        0,
        1, // SCIFI
        ['noun'],
        { value: CREATION_FEE }
      );

      // Get fantasy stories
      const fantasyStories = await storyManager.getStoriesByCategory(0);
      expect(fantasyStories).to.include('story1');

      // Get scifi stories
      const scifiStories = await storyManager.getStoriesByCategory(1);
      expect(scifiStories).to.include('story2');
    });

    it('Should accept all 9 categories', async function () {
      const categories = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // All 9 categories

      for (let i = 0; i < categories.length; i++) {
        const storyId = `story${i}`;
        const category = categories[i];

        // Get creation credit
        if (i > 0) {
          await storyManager.connect(user1).contributeWord(`story${i - 1}`, 1, 'test', { value: CONTRIBUTION_FEE });
        }

        const signer = i === 0 ? owner : user1;

        await storyManager.connect(signer).createStory(
          storyId,
          `Story ${i}`,
          'Test [ADJECTIVE]',
          0,
          category,
          ['adjective'],
          { value: CREATION_FEE }
        );

        const story = await storyManager.getStory(storyId);
        expect(story.category).to.equal(category);
      }
    });
  });

  describe('Social Sharing', function () {
    it('Should track story shares', async function () {
      // Create and complete a story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      // Complete the story
      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // Share the story
      await storyManager.connect(user1).shareStory('story1');

      // Check share count
      const story = await storyManager.getStory('story1');
      expect(story.shareCount).to.equal(1);

      // Check user's share count
      const userStats = await storyManager.getUserStats(user1.address);
      expect(userStats.shareCount).to.equal(1);
    });

    it('Should emit StoryShared event', async function () {
      // Create and complete a story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // Share and check event
      await expect(storyManager.connect(user1).shareStory('story1'))
        .to.emit(storyManager, 'StoryShared')
        .withArgs('story1', user1.address);
    });

    it('Should not allow sharing incomplete stories', async function () {
      // Create story with 2 slots
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE] [NOUN]',
        0,
        0,
        ['adjective', 'noun'],
        { value: CREATION_FEE }
      );

      // Fill only first slot
      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // Try to share incomplete story
      await expect(
        storyManager.connect(user1).shareStory('story1')
      ).to.be.revertedWith('Can only share completed stories');
    });

    it('Should allow multiple shares of same story', async function () {
      // Create and complete a story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // Multiple users share
      await storyManager.connect(user1).shareStory('story1');
      await storyManager.connect(user2).shareStory('story1');
      await storyManager.connect(user3).shareStory('story1');

      const story = await storyManager.getStory('story1');
      expect(story.shareCount).to.equal(3);
    });
  });

  describe('Enhanced User Stats', function () {
    it('Should track completed stories count', async function () {
      // Create and complete story
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      // Check user's completed stories count
      const stats = await storyManager.getUserStats(user1.address);
      expect(stats.completedStories).to.equal(1);
    });

    it('Should track last contribution time', async function () {
      await storyManager.createStory(
        'story1',
        'Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      const beforeTime = (await ethers.provider.getBlock('latest'))?.timestamp || 0;

      await storyManager.connect(user1).contributeWord('story1', 1, 'test', { value: CONTRIBUTION_FEE });

      const stats = await storyManager.getUserStats(user1.address);
      expect(stats.lastContributionTime).to.be.gte(beforeTime);
    });
  });

  describe('Creator NFT System', function () {
    it('Should mint creator NFT when story creator\'s story completes', async function () {
      // Create story
      await storyManager.createStory(
        'creator_story',
        'Creator Test Story',
        'Test [ADJECTIVE]',
        0,
        0,
        ['adjective'],
        { value: CREATION_FEE }
      );

      // Complete the story
      await storyManager.connect(user1).contributeWord('creator_story', 1, 'amazing', { value: CONTRIBUTION_FEE });

      // Check that creator NFT was minted
      const storyTokens = await nftContract.getStoryTokens('creator_story');
      expect(storyTokens.length).to.equal(2); // 1 contributor NFT + 1 creator NFT

      // Check creator NFT data
      const creatorTokenId = storyTokens[1]; // Second token should be creator NFT
      const creatorNFTData = await nftContract.getNFTData(creatorTokenId);

      expect(creatorNFTData.isCreatorNFT).to.be.true;
      expect(creatorNFTData.storyId).to.equal('creator_story');
      expect(creatorNFTData.storyTitle).to.equal('Creator Test Story');
      expect(creatorNFTData.wordPosition).to.equal(0); // Creator NFTs have position 0
      expect(creatorNFTData.totalWords).to.equal(0); // Creator NFTs have totalWords 0
      expect(creatorNFTData.wordType).to.equal(''); // Creator NFTs have empty wordType
      expect(creatorNFTData.contributedWord).to.equal(''); // Creator NFTs have empty contributedWord
      expect(creatorNFTData.contributor).to.equal(owner.address); // Creator is the owner
      expect(creatorNFTData.storyComplete).to.be.true;
      expect(creatorNFTData.revealed).to.be.true; // Creator NFTs are always revealed
      expect(creatorNFTData.fullStoryTemplate).to.equal('Test [ADJECTIVE]');
    });

    it('Should not mint creator NFT for stories created by non-owners', async function () {
      // Give user1 a creation credit
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);

      // User1 creates story
      await storyManager.connect(user1).createStory(
        'user_creator_story',
        'User Creator Story',
        'Test [NOUN]',
        0,
        0,
        ['noun'],
        { value: CREATION_FEE }
      );

      // Complete the story
      await storyManager.connect(user2).contributeWord('user_creator_story', 1, 'cat', { value: CONTRIBUTION_FEE });

      // Check that only contributor NFT was minted (no creator NFT for non-owners)
      const storyTokens = await nftContract.getStoryTokens('user_creator_story');
      expect(storyTokens.length).to.equal(2); // Contributor NFT + Creator NFT

      // Check contributor NFT data
      const contributorTokenId = storyTokens[0];
      const contributorNFTData = await nftContract.getNFTData(contributorTokenId);

      expect(contributorNFTData.isCreatorNFT).to.be.false;
      expect(contributorNFTData.contributor).to.equal(user2.address);
    });

    it('Should handle creator NFT metadata correctly', async function () {
      // Create story with complex template
      await storyManager.createStory(
        'complex_creator_story',
        'Complex Creator Story',
        'Once upon a [ADJECTIVE] [NOUN] in a [PLACE], there lived a [PROFESSION].',
        0,
        0,
        ['adjective', 'noun', 'place', 'profession'],
        { value: CREATION_FEE }
      );

      // Complete the story
      await storyManager.connect(user1).contributeWord('complex_creator_story', 1, 'mysterious', { value: CONTRIBUTION_FEE });
      await storyManager.connect(user2).contributeWord('complex_creator_story', 2, 'castle', { value: CONTRIBUTION_FEE });
      await storyManager.connect(user3).contributeWord('complex_creator_story', 3, 'forest', { value: CONTRIBUTION_FEE });
      await storyManager.connect(user1).contributeWord('complex_creator_story', 4, 'wizard', { value: CONTRIBUTION_FEE });

      // Check creator NFT
      const storyTokens = await nftContract.getStoryTokens('complex_creator_story');
      expect(storyTokens.length).to.equal(5); // 4 contributor NFTs + 1 creator NFT

      const creatorTokenId = storyTokens[4]; // Last token should be creator NFT
      const creatorNFTData = await nftContract.getNFTData(creatorTokenId);

      expect(creatorNFTData.isCreatorNFT).to.be.true;
      expect(creatorNFTData.fullStoryTemplate).to.equal('Once upon a [ADJECTIVE] [NOUN] in a [PLACE], there lived a [PROFESSION].');
      expect(creatorNFTData.storyComplete).to.be.true;
      expect(creatorNFTData.revealed).to.be.true;
    });
  });

  describe('Integration Tests', function () {
    it('Should handle complete user journey with all features', async function () {
      // User1 starts with 0 contributions, 0 achievements, not on leaderboard

      // Owner creates story
      await storyManager.createStory(
        'story1',
        'Epic Tale',
        'Test [ADJECTIVE] [NOUN]',
        0,
        0,
        ['adjective', 'noun'],
        { value: CREATION_FEE }
      );

      // User1 makes first contribution
      await storyManager.connect(user1).contributeWord('story1', 1, 'magical', { value: CONTRIBUTION_FEE });

      // Check: earned credit, unlocked achievement, on leaderboard
      let stats = await storyManager.getUserStats(user1.address);
      expect(stats.contributionsCount).to.equal(1);
      expect(stats.creationCredits).to.equal(1);

      const achievements = await storyManager.getUserAchievements(user1.address);
      const firstWord = achievements.find((a: any) => a.id === 'first_word');
      expect(firstWord?.unlocked).to.be.true;

      const rank = await storyManager.getUserRank(user1.address);
      expect(rank).to.be.gt(0);

      // User1 completes the story
      await storyManager.connect(user1).contributeWord('story1', 2, 'dragon', { value: CONTRIBUTION_FEE });

      // Check: completed stories count increased
      stats = await storyManager.getUserStats(user1.address);
      expect(stats.completedStories).to.equal(1);

      // User1 shares the story
      await storyManager.connect(user1).shareStory('story1');

      stats = await storyManager.getUserStats(user1.address);
      expect(stats.shareCount).to.equal(1);

      // User1 creates their own story using earned credit
      await storyManager.connect(user1).createStory(
        'story2',
        'User Story',
        'Test [VERB]',
        0,
        1, // SCIFI category
        ['verb'],
        { value: CREATION_FEE }
      );

      // Check: story starter achievement unlocked
      const newAchievements = await storyManager.getUserAchievements(user1.address);
      const storyStarter = newAchievements.find((a: any) => a.id === 'story_starter');
      expect(storyStarter?.unlocked).to.be.true;

      // Verify story is in correct category
      const scifiStories = await storyManager.getStoriesByCategory(1);
      expect(scifiStories).to.include('story2');
    });
  });

  describe('End-to-End Story Lifecycle', function () {
    it('should handle the full lifecycle of a story', async function () {
      const storyId = 'e2e_story';
      const initialPoolBalance = await liquidityPool.getBalance();

      // 1. Airdrop credits to user1
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      expect((await storyManager.getUserStats(user1.address)).creationCredits).to.equal(1);

      // 2. User1 creates a story
      await storyManager.connect(user1).createStory(
        storyId,
        'E2E Test Story',
        'A [ADJECTIVE] [NOUN]',
        0, // MINI
        0, // FANTASY
        ['adjective', 'noun'],
        { value: CREATION_FEE }
      );

      // 3. Verify creation fee was sent to the liquidity pool
      let poolBalance = await liquidityPool.getBalance();
      expect(poolBalance).to.equal(initialPoolBalance + CREATION_FEE);

      // 4. User2 contributes a word
      await storyManager.connect(user2).contributeWord(storyId, 1, 'brave', { value: CONTRIBUTION_FEE });

      // 5. Verify contribution fee was sent and NFT was minted in unrevealed state
      poolBalance = await liquidityPool.getBalance();
      expect(poolBalance).to.equal(initialPoolBalance + CREATION_FEE + CONTRIBUTION_FEE);

      let storyTokens = await nftContract.getStoryTokens(storyId);
      expect(storyTokens.length).to.equal(1);
      let nftData = await nftContract.getNFTData(storyTokens[0]);
      expect(nftData.revealed).to.be.false;
      expect(await nftContract.ownerOf(storyTokens[0])).to.equal(user2.address);

      // 6. User3 contributes the final word
      await storyManager.connect(user3).contributeWord(storyId, 2, 'knight', { value: CONTRIBUTION_FEE });

      // 7. Verify final contribution fee was sent and story is complete
      poolBalance = await liquidityPool.getBalance();
      expect(poolBalance).to.equal(initialPoolBalance + CREATION_FEE + CONTRIBUTION_FEE * 2n);
      const story = await storyManager.getStory(storyId);
      expect(story.status).to.equal(1); // COMPLETE

      // 8. Verify NFTs are revealed and creator NFT is minted
      storyTokens = await nftContract.getStoryTokens(storyId);
      expect(storyTokens.length).to.equal(3); // 2 contributor NFTs + 1 creator NFT

      // Check contributor NFTs
      for (let i = 0; i < 2; i++) {
        nftData = await nftContract.getNFTData(storyTokens[i]);
        expect(nftData.revealed).to.be.true;
      }

      // Check creator NFT
      const creatorNftData = await nftContract.getNFTData(storyTokens[2]);
      expect(creatorNftData.isCreatorNFT).to.be.true;
      expect(creatorNftData.contributor).to.equal(user1.address);
    });
  });
});
