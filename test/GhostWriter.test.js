const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GhostWriter System", function () {
  let nft;
  let storyManager;
  let liquidityPool;
  let priceOracle;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy LiquidityPool
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();

    // Deploy PriceOracle with mock Chainlink feed (use fallback)
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const mockFeedAddress = "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1"; // Base Sepolia feed
    priceOracle = await PriceOracle.deploy(mockFeedAddress);

    // Deploy NFT contract
    const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
    nft = await GhostWriterNFT.deploy(
      "https://api.example.com/hidden/",
      "https://api.example.com/revealed/"
    );

    // Deploy StoryManager with PriceOracle
    const StoryManager = await ethers.getContractFactory("StoryManager");
    storyManager = await StoryManager.deploy(
      await nft.getAddress(),
      await liquidityPool.getAddress(),
      await priceOracle.getAddress()
    );

    // Set permissions
    await nft.setStoryManager(await storyManager.getAddress());
  });

  describe("Deployment", function () {
    it("Should deploy all contracts correctly", async function () {
      expect(await nft.name()).to.equal("Ghost Writer NFT");
      expect(await nft.symbol()).to.equal("GHOST");
      expect(await nft.storyManager()).to.equal(await storyManager.getAddress());
    });

    it("Should have correct initial state", async function () {
      expect(await nft.totalSupply()).to.equal(0);
      expect(await storyManager.getActiveStoriesCount()).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should prevent unauthorized NFT minting", async function () {
      await expect(
        nft.connect(user1).mintHiddenNFT(
          user1.address,
          "story1",
          "Test Story",
          1,
          10,
          "adjective",
          "test"
        )
      ).to.be.revertedWith("Only StoryManager can call");
    });

    it("Should prevent unauthorized base URI updates", async function () {
      await expect(
        nft.connect(user1).updateBaseURIs("new://", "new2://")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Basic Operations", function () {
    it("Should allow owner to set story manager", async function () {
      const newAddress = user1.address;
      await nft.connect(owner).setStoryManager(newAddress);
      expect(await nft.storyManager()).to.equal(newAddress);
    });

    it("Should prevent non-owner from setting story manager", async function () {
      await expect(
        nft.connect(user1).setStoryManager(user1.address)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });
});
