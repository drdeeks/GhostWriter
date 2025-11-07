import { expect } from "chai";
import { ethers } from "hardhat";
import { GhostWriterNFT, StoryManager, LiquidityPool } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StoryManager Expansion", function () {
  let nftContract: GhostWriterNFT;
  let storyManager: StoryManager;
  let liquidityPool: LiquidityPool;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const CONTRIBUTION_FEE = ethers.parseEther("0.00005");
  const CREATION_FEE = ethers.parseEther("0.0001");
  const HIDDEN_URI = "ipfs://QmHidden/";
  const REVEALED_URI = "ipfs://QmRevealed/";

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();
    await liquidityPool.waitForDeployment();

    const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
    nftContract = await GhostWriterNFT.deploy(HIDDEN_URI, REVEALED_URI);
    await nftContract.waitForDeployment();

    const StoryManager = await ethers.getContractFactory("StoryManager");
    storyManager = await StoryManager.deploy(
      await nftContract.getAddress(),
      await liquidityPool.getAddress()
    );
    await storyManager.waitForDeployment();

    await nftContract.setStoryManager(await storyManager.getAddress());
    await liquidityPool.setStoryManager(await storyManager.getAddress());

    // Pre-fund users with creation credits
    await storyManager.connect(owner).airdropCredits([user1.address, user2.address, user3.address], [10, 10, 10]);
  });

  describe("Story Lifecycle", function () {
    it("Should create a story with correct parameters", async function () {
      const storyId = "s1";
      await storyManager.connect(user1).createStory(storyId, "Title", "Template", 0, 0, ["a"], { value: CREATION_FEE });
      const story = await storyManager.getStory(storyId);
      expect(story.title).to.equal("Title");
      expect(story.creator).to.equal(user1.address);
      expect(story.totalSlots).to.equal(1);
    });

    it("Should allow multiple contributions and complete a story", async function () {
      const storyId = "s2";
      await storyManager.connect(user1).createStory(storyId, "Title", "T", 0, 0, ["a", "b"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord(storyId, 1, "word1", { value: CONTRIBUTION_FEE });
      let story = await storyManager.getStory(storyId);
      expect(story.filledSlots).to.equal(1);
      expect(story.status).to.equal(0); // Active

      await storyManager.connect(user3).contributeWord(storyId, 2, "word2", { value: CONTRIBUTION_FEE });
      story = await storyManager.getStory(storyId);
      expect(story.filledSlots).to.equal(2);
      expect(story.status).to.equal(1); // Complete
    });
  });

  describe("Achievements", function () {
    it("Should unlock 'First Word' achievement", async function () {
      await storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 1, "word", { value: CONTRIBUTION_FEE });
      const achievements = await storyManager.getUserAchievements(user2.address);
      const firstWordAchievement = achievements.find(a => a.id === 'first_word');
      expect(firstWordAchievement?.unlocked).to.be.true;
    });

    it("Should unlock 'Story Starter' achievement", async function () {
      await storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a"], { value: CREATION_FEE });
      const achievements = await storyManager.getUserAchievements(user1.address);
      const storyStarterAchievement = achievements.find(a => a.id === 'story_starter');
      expect(storyStarterAchievement?.unlocked).to.be.true;
    });
  });

  describe("Leaderboard", function () {
    beforeEach(async function () {
      await storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a", "b", "c"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 1, "word_one", { value: CONTRIBUTION_FEE });
      await storyManager.connect(user3).contributeWord("s1", 2, "word_two", { value: CONTRIBUTION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 3, "word_three", { value: CONTRIBUTION_FEE });
    });

    it("Should update user ranks correctly", async function () {
      let rank2 = await storyManager.getUserRank(user2.address);
      let rank3 = await storyManager.getUserRank(user3.address);
      expect(rank2).to.equal(1); // user2 has 2 contributions
      expect(rank3).to.equal(2); // user3 has 1 contribution
    });

    it("Should return a sorted leaderboard", async function () {
      const leaderboard = await storyManager.getLeaderboard(0, 10);
      expect(leaderboard.length).to.equal(2);
      expect(leaderboard[0].user).to.equal(user2.address);
      expect(leaderboard[0].contributions).to.equal(2);
      expect(leaderboard[1].user).to.equal(user3.address);
      expect(leaderboard[1].contributions).to.equal(1);
    });
  });

  describe("User Stats and Credits", function () {
    beforeEach(async function () {
      await storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 1, "word", { value: CONTRIBUTION_FEE });
    });

    it("Should increment contributions count", async function () {
      const stats = await storyManager.getUserStats(user2.address);
      expect(stats.contributionsCount).to.equal(1);
    });

    it("Should award creation credits for contributions", async function () {
      const initialCredits = (await storyManager.getUserStats(user2.address)).creationCredits;
      // The beforeEach contributes once.
      expect(initialCredits).to.equal(11); // 10 airdropped + 1 from contribution
    });

    it("Should track stories created", async function () {
      const stats = await storyManager.getUserStats(user1.address);
      expect(stats.storiesCreated).to.equal(1);
    });
  });
});
