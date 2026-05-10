const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🍷 The GhostWriter Tasting Suite", function () {
  let nft, storyManager, owner, user1;
  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    const liquidityPool = await LiquidityPool.deploy();
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const mockFeed = await MockV3Aggregator.deploy(8, 3000_00000000);
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy(await mockFeed.getAddress());
    const GhostWriterNFT = await ethers.getContractFactory("GhostWriterNFT");
    nft = await GhostWriterNFT.deploy("https://hidden/", "https://revealed/");
    const StoryManager = await ethers.getContractFactory("StoryManager");
    storyManager = await StoryManager.deploy(await nft.getAddress(), await liquidityPool.getAddress(), await priceOracle.getAddress());
    await nft.setStoryManager(await storyManager.getAddress());
  });
  it("🧐 AROMA: Validate On-Chain Hierarchy", async function () {
    await storyManager.setCoAdmin(user1.address, true);
    expect(await storyManager.coAdmins(user1.address)).to.be.true;
  });
  it("👅 PALATE: Verify Whitelist Free Access", async function () {
    await storyManager.setWhitelist(user1.address, true);
    const creationFee = await storyManager.connect(user1).getCreationFee();
    expect(creationFee).to.equal(0);
  });
  it("🧠 BODY: Rigorous Synthetic Logic Check", async function () {
    expect(await storyManager.MINI_SLOTS_MIN()).to.equal(5);
    expect(await storyManager.EPIC_SLOTS_MAX()).to.equal(35);
  });
  it("✨ FINISH: The Automatic Reveal Event", async function () {
    await expect(storyManager.finalizeStory("test_story")).to.not.be.reverted;
  });
});