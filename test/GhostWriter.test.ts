import { expect } from "chai";
import { ethers } from "hardhat";
import { GhostWriterNFT, StoryManager, LiquidityPool } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

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
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy LiquidityPool
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();
    await liquidityPool.waitForDeployment();

    // Deploy NFT contract
    const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
    nftContract = await GhostWriterNFT.deploy(HIDDEN_URI, REVEALED_URI);
    await nftContract.waitForDeployment();

    // Deploy StoryManager
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
  });

  describe("GhostWriterNFT: URI Management", function () {
    it("Should return hidden URI for unrevealed token", async function () {
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      // Create a story with 2 slots so it doesn't complete after one contribution
      await storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a", "b"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 1, "word", { value: CONTRIBUTION_FEE });
      expect(await nftContract.tokenURI(1)).to.equal(HIDDEN_URI + "1");
    });

    it("Should return revealed URI for revealed token", async function () {
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 1, "word", { value: CONTRIBUTION_FEE });
      // Story completes and reveals
      expect(await nftContract.tokenURI(1)).to.equal(REVEALED_URI + "1");
    });

    it("Should allow owner to update URIs", async function () {
      const newHidden = "ipfs://newHidden/";
      const newRevealed = "ipfs://newRevealed/";
      await nftContract.connect(owner).updateBaseURIs(newHidden, newRevealed);

      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a", "b"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 1, "word", { value: CONTRIBUTION_FEE });
      expect(await nftContract.tokenURI(1)).to.equal(newHidden + "1");

      await storyManager.connect(user3).contributeWord("s1", 2, "word2", { value: CONTRIBUTION_FEE });
      expect(await nftContract.tokenURI(1)).to.equal(newRevealed + "1");
    });
  });

  describe("GhostWriterNFT: Data and Ownership", function () {
    beforeEach(async function () {
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await storyManager.connect(user1).createStory("s1", "Test Story", "T", 0, 0, ["a", "b"], { value: CREATION_FEE });
      await storyManager.connect(user2).contributeWord("s1", 1, "word1", { value: CONTRIBUTION_FEE });
      await storyManager.connect(user3).contributeWord("s1", 2, "word2", { value: CONTRIBUTION_FEE });
    });

    it("Should correctly store NFT data", async function () {
      const data = await nftContract.getNFTData(1);
      expect(data.storyId).to.equal("s1");
      expect(data.storyTitle).to.equal("Test Story");
      expect(data.wordPosition).to.equal(1);
      expect(data.totalWords).to.equal(2);
      expect(data.contributor).to.equal(user2.address);
      expect(data.revealed).to.be.true;
    });

    it("Should assign token ownership to contributor", async function () {
      expect(await nftContract.ownerOf(1)).to.equal(user2.address);
      expect(await nftContract.ownerOf(2)).to.equal(user3.address);
    });

    it("Should track story tokens correctly", async function () {
      const tokens = await nftContract.getStoryTokens("s1");
      expect(tokens.length).to.equal(2);
      expect(tokens[0]).to.equal(1);
      expect(tokens[1]).to.equal(2);
    });
  });

  describe("Story Creation", function () {
    it("Should fail to create story without creation credit", async function () {
      await expect(
        storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a"], { value: CREATION_FEE })
      ).to.be.revertedWith("Need creation credits");
    });

    it("Should create story after earning creation credit", async function () {
      await storyManager.connect(owner).airdropCredits([user1.address], [1]);
      await expect(
        storyManager.connect(user1).createStory("s1", "T", "T", 0, 0, ["a"], { value: CREATION_FEE })
      ).to.emit(storyManager, "StoryCreated");
    });
  });

  describe("Word Contribution Flow", function () {
    beforeEach(async function () {
      await storyManager.connect(owner).airdropCredits([owner.address], [1]);
      await storyManager.connect(owner).createStory("s1", "T", "T", 0, 0, ["a"], { value: CREATION_FEE });
    });

    it("Should fail to contribute without correct fee", async function () {
      await expect(
        storyManager.connect(user1).contributeWord("s1", 1, "w", { value: ethers.parseEther("0.00001") })
      ).to.be.revertedWith("Incorrect contribution fee");
    });

    it("Should fail to contribute to non-existent story", async function () {
      await expect(
        storyManager.connect(user1).contributeWord("nonexistent", 1, "w", { value: CONTRIBUTION_FEE })
      ).to.be.revertedWith("Story does not exist");
    });
  });
});
