import { expect } from "chai";
import { ethers } from "hardhat";
import { GhostWriterNFT, StoryManager, LiquidityPool } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Deployment and Initial State", function () {
  let nftContract: GhostWriterNFT;
  let storyManager: StoryManager;
  let liquidityPool: LiquidityPool;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  const HIDDEN_URI = "ipfs://QmHidden/";
  const REVEALED_URI = "ipfs://QmRevealed/";

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

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

  it("Should have correct owners", async function () {
    expect(await nftContract.owner()).to.equal(owner.address);
    expect(await storyManager.owner()).to.equal(owner.address);
    expect(await liquidityPool.owner()).to.equal(owner.address);
  });

  it("Should have correct StoryManager addresses set", async function () {
    expect(await nftContract.storyManager()).to.equal(await storyManager.getAddress());
    expect(await liquidityPool.storyManager()).to.equal(await storyManager.getAddress());
  });

  it("Should have correct NFT name and symbol", async function () {
    expect(await nftContract.name()).to.equal("Ghost Writer NFT");
    expect(await nftContract.symbol()).to.equal("GHOST");
  });

  it("Should have 0 total supply initially", async function () {
    expect(await nftContract.totalSupply()).to.equal(0);
  });

  it("Should have 0 stories initially", async function () {
    expect(await storyManager.getTotalStories()).to.equal(0);
  });

  it("Liquidity pool should be empty", async function () {
    expect(await liquidityPool.getBalance()).to.equal(0);
    expect(await liquidityPool.totalCollected()).to.equal(0);
  });
});
