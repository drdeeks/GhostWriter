import { expect } from "chai";
import { ethers } from "hardhat";
import { GhostWriterNFT, StoryManager, LiquidityPool } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Bootstrap Tests
 * Tests the initial setup and first story creation flow
 * Solves the "chicken-egg" problem of needing credits to create stories
 */
describe("Bootstrap Flow Tests", function () {
  let nftContract: GhostWriterNFT;
  let storyManager: StoryManager;
  let liquidityPool: LiquidityPool;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const CONTRIBUTION_FEE = ethers.parseEther("0.00005");
  const CREATION_FEE = ethers.parseEther("0.0001");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy contracts
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();
    await liquidityPool.waitForDeployment();

    const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
    nftContract = await GhostWriterNFT.deploy(
      "ipfs://QmHidden/",
      "ipfs://QmRevealed/"
    );
    await nftContract.waitForDeployment();

    const StoryManager = await ethers.getContractFactory("StoryManager");
    storyManager = await StoryManager.deploy(
      await nftContract.getAddress(),
      await liquidityPool.getAddress()
    );
    await storyManager.waitForDeployment();

    // Setup permissions
    await nftContract.setStoryManager(await storyManager.getAddress());
    await liquidityPool.setStoryManager(await storyManager.getAddress());
  });

  describe("Initial Bootstrap Strategy", function () {
    it("Should demonstrate bootstrap problem", async function () {
      // No one has credits initially
      const user1Stats = await storyManager.getUserStats(user1.address);
      expect(user1Stats.creationCredits).to.equal(0);

      // Can't create story without credits
      await expect(
        storyManager.connect(user1).createStory(
          "story_001",
          "First Story",
          "Template [ADJECTIVE]",
          0, // MINI
          ["adjective"],
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Need creation credits");
    });

    it("Solution: Owner creates first story manually with airdropped credit", async function () {
      // In production, owner would:
      // 1. Deploy contracts
      // 2. Manually give themselves 1 creation credit via contract modification
      // 3. Or include initial credit in deployment
      
      // For this test, we demonstrate the intended flow:
      // Owner should have a way to bootstrap the first story
      
      // This test documents that we need either:
      // A) Initial credit for owner in constructor
      // B) Special "createFirstStory" function
      // C) Manual credit distribution function (owner only)
      
      // Currently, even owner can't create without credits
      const ownerStats = await storyManager.getUserStats(owner.address);
      expect(ownerStats.creationCredits).to.equal(0);
    });
  });

  describe("Recommended Solution: Add Bootstrap Function", function () {
    it("Should allow owner to airdrop creation credits", async function () {
      // This test documents the need for a function like:
      // function airdropCredits(address[] users, uint256[] amounts) onlyOwner
      
      // For now, we document this requirement
      // Contract should be modified to include bootstrap mechanism
      
      // Expected behavior after adding function:
      // await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      // const stats = await storyManager.getUserStats(user1.address);
      // expect(stats.creationCredits).to.equal(1);
      
      this.skip(); // Skip until function is added
    });
  });

  describe("Full Flow After Bootstrap", function () {
    // Simulate that owner has manually given user1 a creation credit
    // We'll test the full flow assuming that's done
    
    it("Should complete full story cycle", async function () {
      // This test documents the complete expected flow:
      
      // 1. Owner airdrops 1 credit to user1
      // (would require airdropCredits function)
      
      // 2. User1 creates a story
      // const storyId = "story_001";
      // await storyManager.connect(user1).createStory(...)
      
      // 3. User2 contributes word
      // await storyManager.connect(user2).contributeWord(storyId, 1, "sparkly", {value: CONTRIBUTION_FEE})
      
      // 4. User2 now has 1 creation credit
      // 5. User3 contributes word
      // 6. User3 now has 1 creation credit
      // 7. Story continues until complete
      // 8. NFTs reveal
      
      this.skip(); // Skip until bootstrap function exists
    });
  });
});
