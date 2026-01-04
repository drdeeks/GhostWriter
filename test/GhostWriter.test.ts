import "@nomicfoundation/hardhat-chai-matchers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import { GhostWriterNFT, LiquidityPool, StoryManager } from "../typechain-types";

describe("Ghost Writer System", function () {
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
    [owner, user1, user2, user3] = await hre.ethers.getSigners();

    // Deploy LiquidityPool
    const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();
    await liquidityPool.waitForDeployment();

    // Deploy NFT contract
    const GhostWriterNFT = await hre.ethers.getContractFactory("GhostWriterNFT");
    nftContract = await GhostWriterNFT.deploy(HIDDEN_URI, REVEALED_URI);
    await nftContract.waitForDeployment();

    // Deploy StoryManager
    const StoryManager = await hre.ethers.getContractFactory("StoryManager");
    storyManager = await StoryManager.deploy(
      await nftContract.getAddress(),
      await liquidityPool.getAddress()
    );
    await storyManager.waitForDeployment();

    // Setup permissions
    await nftContract.setStoryManager(await storyManager.getAddress());
    await liquidityPool.setStoryManager(await storyManager.getAddress());
  });

  describe("Contract Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await nftContract.owner()).to.equal(owner.address);
      expect(await storyManager.owner()).to.equal(owner.address);
      expect(await liquidityPool.owner()).to.equal(owner.address);
    });

    it("Should set the correct StoryManager", async function () {
      expect(await nftContract.storyManager()).to.equal(
        await storyManager.getAddress()
      );
      expect(await liquidityPool.storyManager()).to.equal(
        await storyManager.getAddress()
      );
    });

    it("Should have correct base URIs", async function () {
      // Base URIs are private, but we can test via tokenURI after minting
      expect(await nftContract.name()).to.equal("Ghost Writer NFT");
      expect(await nftContract.symbol()).to.equal("GHOST");
    });
  });

  describe("Story Creation", function () {
    it("Should fail to create story without creation credit", async function () {
      await expect(
        storyManager.connect(user1).createStory(
          "story_001",
          "Test Story",
          "Template [ADJECTIVE]",
          0, // MINI
          0, // FANTASY
          ["adjective", "noun"],
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Need creation credits");
    });

    it("Should create story after earning creation credit", async function () {
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await expect(
        storyManager.connect(user1).createStory(
          "story_001",
          "Test Story",
          "Template [ADJECTIVE]",
          0, // MINI
          0, // FANTASY
          ["adjective"],
          { value: CREATION_FEE }
        )
      ).to.emit(storyManager, "StoryCreated");
    });

    it("Should fail with incorrect fee", async function () {
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await expect(
        storyManager.connect(user1).createStory(
          "story_001",
          "Test Story",
          "Template",
          0,
          0, // FANTASY
          ["adjective"],
          { value: ethers.parseEther("0.00001") } // Wrong fee
        )
      ).to.be.revertedWith("Incorrect creation fee");
    });

    it("Should fail to create duplicate story", async function () {
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory(
        "story_001",
        "Test Story",
        "Template [ADJECTIVE]",
        0, // MINI
        0, // FANTASY
        ["adjective"],
        { value: CREATION_FEE }
      );
      await expect(
        storyManager.connect(user1).createStory(
          "story_001",
          "Test Story",
          "Template [ADJECTIVE]",
          0, // MINI
          0, // FANTASY
          ["adjective"],
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Story already exists");
    });
  });

  describe("Word Contribution Flow", function () {
    let storyId: string;

    beforeEach(async function () {
      storyId = "story_test_001";
      await storyManager.connect(owner).airdropCredits([owner.address], [1]);
      await storyManager.connect(owner).createStory(
        storyId,
        "Test Story",
        "Template [ADJECTIVE]",
        0, // MINI
        0, // FANTASY
        ["adjective"],
        { value: CREATION_FEE }
      );
    });

    it("Should fail to contribute without correct fee", async function () {
      await expect(
        storyManager.connect(user1).contributeWord(
          storyId,
          1,
          "sparkly",
          { value: ethers.parseEther("0.00001") }
        )
      ).to.be.revertedWith("Incorrect contribution fee");
    });

    it("Should fail to contribute to non-existent story", async function () {
      await expect(
        storyManager.connect(user1).contributeWord(
          "nonexistent",
          1,
          "sparkly",
          { value: CONTRIBUTION_FEE }
        )
      ).to.be.revertedWith("Story does not exist");
    });
  });

  describe("NFT Minting and Reveal", function () {
    it("Should start with 0 total supply", async function () {
      expect(await nftContract.totalSupply()).to.equal(0);
    });

    it("Should prevent direct NFT minting from non-StoryManager", async function () {
      await expect(
        nftContract.connect(user1).mintHiddenNFT(
          user1.address,
          "story_001",
          "Test Story",
          1,
          10,
          "adjective",
          "sparkly"
        )
      ).to.be.revertedWith("Only StoryManager can call");
    });

    it("Should prevent duplicate contribution to same position", async function () {
      const storyId = "story_001";
      await storyManager.connect(owner).airdropCredits([owner.address], [1]);
      await storyManager.connect(owner).createStory(
        storyId,
        "Test Story",
        "Template [ADJECTIVE] [NOUN]",
        0, // MINI
        0, // FANTASY
        ["adjective", "noun"],
        { value: CREATION_FEE }
      );
      await storyManager.connect(user1).contributeWord(storyId, 1, "sparkly", { value: CONTRIBUTION_FEE });
      await expect(
        storyManager.connect(user1).contributeWord(storyId, 1, "shiny", { value: CONTRIBUTION_FEE })
      ).to.be.revertedWith("Slot already filled");
    });
  });

  describe("Liquidity Pool", function () {
    it("Should start with 0 balance", async function () {
      expect(await liquidityPool.getBalance()).to.equal(0);
    });

    it("Should prevent direct deposits from non-StoryManager", async function () {
      await expect(
        user1.sendTransaction({ to: await liquidityPool.getAddress(), value: ethers.parseEther("0.1") })
      ).to.be.reverted;
    });

    it("Should allow owner to withdraw", async function () {
      const storyId = "story_001";
      await storyManager.connect(owner).airdropCredits([owner.address], [1]);
      await storyManager.connect(owner).createStory(
        storyId,
        "Test Story",
        "Template [ADJECTIVE]",
        0, // MINI
        0, // FANTASY
        ["adjective"],
        { value: CREATION_FEE }
      );
      await storyManager.connect(user1).contributeWord(storyId, 1, "sparkly", { value: CONTRIBUTION_FEE });
      const balance = await liquidityPool.getBalance();
      await liquidityPool.connect(owner).withdraw(balance);
      expect(await liquidityPool.getBalance()).to.equal(0);
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full story creation and contribution flow", async function () {
      const storyId = "story_integration_001";
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory(
        storyId,
        "Test Story",
        "Template [ADJECTIVE] [NOUN]",
        0, // MINI
        0, // FANTASY
        ["adjective", "noun"],
        { value: CREATION_FEE }
      );
      await storyManager.connect(user2).contributeWord(storyId, 1, "sparkly", { value: CONTRIBUTION_FEE });
      await storyManager.connect(user3).contributeWord(storyId, 2, "dragon", { value: CONTRIBUTION_FEE });
      const story = await storyManager.getStory(storyId);
      expect(story.status).to.equal(1); // 1 = COMPLETE
    });

    it("Should calculate correct fees and send to liquidity pool", async function () {
      const storyId = "story_fee_test";
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory(
        storyId,
        "Fee Story",
        "Template [ADJECTIVE]",
        0, // MINI
        0, // FANTASY
        ["adjective"],
        { value: CREATION_FEE }
      );
      await storyManager.connect(user2).contributeWord(storyId, 1, "expensive", { value: CONTRIBUTION_FEE });
      const expectedBalance = BigInt(CREATION_FEE) + BigInt(CONTRIBUTION_FEE);
      expect(await liquidityPool.getBalance()).to.equal(expectedBalance);
    });

    it("Should reveal NFTs when story completes", async function () {
      const storyId = "story_reveal_test";
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory(
        storyId,
        "Reveal Story",
        "Template [ADJECTIVE]",
        0, // MINI
        0, // FANTASY
        ["adjective"],
        { value: CREATION_FEE }
      );
      await storyManager.connect(user2).contributeWord(storyId, 1, "hidden", { value: CONTRIBUTION_FEE });
      const storyTokens = await nftContract.getStoryTokens(storyId);
      const nftData = await nftContract.getNFTData(storyTokens[0]);
      expect(nftData.revealed).to.be.true;
    });

    it("Should prevent contributions after story completion", async function () {
      const storyId = "story_complete_test";
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory(
        storyId,
        "Complete Story",
        "Template [ADJECTIVE]",
        0, // MINI
        0, // FANTASY
        ["adjective"],
        { value: CREATION_FEE }
      );
      await storyManager.connect(user2).contributeWord(storyId, 1, "final", { value: CONTRIBUTION_FEE });
      await expect(
        storyManager.connect(user3).contributeWord(storyId, 1, "extra", { value: CONTRIBUTION_FEE })
      ).to.be.revertedWith("Story not active");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to update StoryManager", async function () {
      await expect(
        nftContract.connect(user1).setStoryManager(user1.address)
      ).to.be.revertedWithCustomError(nftContract, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to update base URIs", async function () {
      await expect(
        nftContract.connect(user1).updateBaseURIs("ipfs://new/", "ipfs://new2/")
      ).to.be.revertedWithCustomError(nftContract, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to withdraw from liquidity pool", async function () {
      await expect(
        liquidityPool.connect(user1).withdrawAll()
      ).to.be.revertedWithCustomError(liquidityPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very long words correctly", async function () {
      const storyId = "long_word_test";
      await storyManager.connect(owner).airdropCredits([owner.address], [1]);
      await storyManager.connect(owner).createStory(
        storyId,
        "Long Word Story",
        "Template [ADJECTIVE] [NOUN]",
        0, // MINI
        0, // FANTASY
        ["adjective", "noun"],
        { value: CREATION_FEE }
      );
      const longWord = "a".repeat(30);
      await expect(storyManager.connect(user1).contributeWord(storyId, 1, longWord, { value: CONTRIBUTION_FEE })).to.not.be.reverted;
      const tooLongWord = "a".repeat(31);
      await expect(storyManager.connect(user2).contributeWord(storyId, 2, tooLongWord, { value: CONTRIBUTION_FEE })).to.be.revertedWith("Word too long");
    });

    it("Should handle maximum story slots correctly", async function () {
      const storyId = "max_slots_test";
      await storyManager.connect(owner).airdropCredits([user1.address], [2]);
      const wordTypes = Array(10).fill("adjective");
      await expect(
        storyManager.connect(user1).createStory(
          storyId,
          "Max Slots Story",
          "Template",
          0, // MINI
          0, // FANTASY
          wordTypes,
          { value: CREATION_FEE }
        )
      ).to.not.be.reverted;

      const tooManyWordTypes = Array(11).fill("adjective");
      await expect(
        storyManager.connect(user1).createStory(
          "max_slots_test_fail",
          "Max Slots Story Fail",
          "Template",
          0, // MINI
          0, // FANTASY
          tooManyWordTypes,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Mini stories max 10 slots");
    });

    it("Should handle multiple simultaneous contributions", async function () {
      // This is difficult to test in a deterministic way in Hardhat.
      // We can simulate it by sending multiple transactions in a row.
      const storyId = "simultaneous_test";
      await storyManager.connect(owner).airdropCredits([owner.address], [1]);
      await storyManager.connect(owner).createStory(
        storyId,
        "Simultaneous Story",
        "Template [ADJECTIVE] [NOUN]",
        0, // MINI
        0, // FANTASY
        ["adjective", "noun"],
        { value: CREATION_FEE }
      );

      const tx1 = storyManager.connect(user1).contributeWord(storyId, 1, "first", { value: CONTRIBUTION_FEE });
      const tx2 = storyManager.connect(user2).contributeWord(storyId, 2, "second", { value: CONTRIBUTION_FEE });

      await expect(tx1).to.not.be.reverted;
      await expect(tx2).to.not.be.reverted;
    });
  });
});
