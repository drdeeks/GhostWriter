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

  function hashWordTypes(wordTypes) {
    // Must match StoryManager._hashWordTypes:
    // acc = keccak256(abi.encodePacked(acc, keccak256(bytes(wordType))))
    let acc = ethers.ZeroHash;
    for (const wt of wordTypes) {
      const wtHash = ethers.keccak256(ethers.toUtf8Bytes(wt));
      acc = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [acc, wtHash]));
    }
    return acc;
  }

  async function signCreateStory({
    signer,
    creator,
    storyId,
    title,
    template,
    storyType,
    category,
    wordTypes,
    expiresAt,
  }) {
    const domain = {
      name: "GhostWriterStoryManager",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await storyManager.getAddress(),
    };

    const types = {
      CreateStory: [
        { name: "creator", type: "address" },
        { name: "storyId", type: "string" },
        { name: "title", type: "string" },
        { name: "template", type: "string" },
        { name: "storyType", type: "uint8" },
        { name: "category", type: "uint8" },
        { name: "wordTypesHash", type: "bytes32" },
        { name: "expiresAt", type: "uint256" },
      ],
    };

    const message = {
      creator,
      storyId,
      title,
      template,
      storyType,
      category,
      wordTypesHash: hashWordTypes(wordTypes),
      expiresAt,
    };

    return signer.signTypedData(domain, types, message);
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy LiquidityPool
    const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
    liquidityPool = await LiquidityPool.deploy();

    // Deploy PriceOracle with local mock Chainlink feed
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const mockFeed = await MockV3Aggregator.deploy(8, 3000_00000000); // $3000 * 1e8

    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy(await mockFeed.getAddress());

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
    await liquidityPool.setStoryManager(await storyManager.getAddress());
    await storyManager.setStoryTemplateSigner(owner.address);
  });

  describe("Enterprise enforcement (EIP-712 approvals)", function () {
    it("Should allow createStoryApproved with a valid server signature and prevent custom user stories", async function () {
      const wordTypes = [
        "adjective",
        "noun",
        "verb",
        "adverb",
        "plural_noun",
        "past_tense_verb",
        "verb_ing",
        "persons_name",
        "place",
        "number",
      ];

      const storyId = "story_approved_1";
      const title = "The Approved Tale";
      const template =
        "Once upon a time [ADJECTIVE] [NOUN] decided to [VERB] [ADVERB] with [PLURAL_NOUN] while [PAST_TENSE_VERB] and [VERB_ING] near [PERSONS_NAME] in [PLACE] for [NUMBER].";

      // Give user1 a creation credit
      await storyManager.airdropCredits([user1.address], [1]);

      const creationFee = await storyManager.getCreationFee();

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiresAt = BigInt(latestBlock.timestamp + 60 * 60);

      const signature = await signCreateStory({
        signer: owner,
        creator: user1.address,
        storyId,
        title,
        template,
        storyType: 0, // MINI
        category: 0, // ADVENTURE
        wordTypes,
        expiresAt,
      });

      await expect(
        storyManager.connect(user1).createStoryApproved(
          storyId,
          title,
          template,
          0,
          0,
          wordTypes,
          expiresAt,
          signature,
          { value: creationFee }
        )
      ).to.not.be.reverted;

      // Non-owner should NOT be allowed to call createStory (custom template backdoor)
      await expect(
        storyManager.connect(user1).createStory(
          "story_custom_should_fail",
          "Custom",
          "Custom template",
          0,
          0,
          wordTypes,
          { value: creationFee }
        )
      ).to.be.revertedWithCustomError(storyManager, "OwnableUnauthorizedAccount");
    });

    it("Should reject createStoryApproved with an invalid signature", async function () {
      const wordTypes = [
        "adjective",
        "noun",
        "verb",
        "adverb",
        "plural_noun",
        "past_tense_verb",
        "verb_ing",
        "persons_name",
        "place",
        "number",
      ];

      const storyId = "story_bad_sig";
      const title = "Bad Sig";
      const template = "Test [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER].";

      await storyManager.airdropCredits([user1.address], [1]);
      const creationFee = await storyManager.getCreationFee();

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiresAt = BigInt(latestBlock.timestamp + 60 * 60);

      // Signed by user2, but signer is set to owner
      const signature = await signCreateStory({
        signer: user2,
        creator: user1.address,
        storyId,
        title,
        template,
        storyType: 0,
        category: 0,
        wordTypes,
        expiresAt,
      });

      await expect(
        storyManager.connect(user1).createStoryApproved(
          storyId,
          title,
          template,
          0,
          0,
          wordTypes,
          expiresAt,
          signature,
          { value: creationFee }
        )
      ).to.be.reverted;
    });

    it("Should reject createStoryApproved when approval is expired", async function () {
      const wordTypes = [
        "adjective",
        "noun",
        "verb",
        "adverb",
        "plural_noun",
        "past_tense_verb",
        "verb_ing",
        "persons_name",
        "place",
        "number",
      ];

      const storyId = "story_expired";
      const title = "Expired";
      const template = "Test [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER].";

      await storyManager.airdropCredits([user1.address], [1]);
      const creationFee = await storyManager.getCreationFee();

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiresAt = BigInt(latestBlock.timestamp - 1);

      const signature = await signCreateStory({
        signer: owner,
        creator: user1.address,
        storyId,
        title,
        template,
        storyType: 0,
        category: 0,
        wordTypes,
        expiresAt,
      });

      await expect(
        storyManager.connect(user1).createStoryApproved(
          storyId,
          title,
          template,
          0,
          0,
          wordTypes,
          expiresAt,
          signature,
          { value: creationFee }
        )
      ).to.be.reverted;
    });
  });

  describe("Completion lifecycle (auto-reveal + finalize idempotency)", function () {
    it("Should auto-reveal contributor NFTs when a story completes, and finalize only once", async function () {
      const wordTypes = [
        "adjective",
        "noun",
        "verb",
        "adverb",
        "plural_noun",
        "past_tense_verb",
        "verb_ing",
        "persons_name",
        "place",
        "number",
      ];

      const storyId = "story_auto_reveal";
      const title = "Auto Reveal";
      const template =
        "A [ADJECTIVE] [NOUN] will [VERB] [ADVERB] with [PLURAL_NOUN], then [PAST_TENSE_VERB] while [VERB_ING] near [PERSONS_NAME] in [PLACE] for [NUMBER].";

      await storyManager.airdropCredits([user1.address], [1]);
      const creationFee = await storyManager.getCreationFee();

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiresAt = BigInt(latestBlock.timestamp + 60 * 60);

      const signature = await signCreateStory({
        signer: owner,
        creator: user1.address,
        storyId,
        title,
        template,
        storyType: 0,
        category: 0,
        wordTypes,
        expiresAt,
      });

      await storyManager.connect(user1).createStoryApproved(
        storyId,
        title,
        template,
        0,
        0,
        wordTypes,
        expiresAt,
        signature,
        { value: creationFee }
      );

      const contributionFee = await storyManager.getContributionFee();

      // Fill all 10 slots
      for (let pos = 1; pos <= 10; pos++) {
        await storyManager
          .connect(user1)
          .contributeWord(storyId, pos, `word${pos}`, { value: contributionFee });
      }

      // Contributor NFTs should be revealed immediately on completion
      const storyTokens = await nft.getStoryTokens(storyId);
      expect(storyTokens.length).to.equal(10);

      for (const tokenId of storyTokens) {
        const data = await nft.getNFTData(tokenId);
        expect(data.revealed).to.equal(true);
        expect(data.storyComplete).to.equal(true);
        expect(data.isCreatorNFT).to.equal(false);
      }

      // finalizeStory mints exactly one creator NFT
      const supplyBefore = await nft.totalSupply();
      await storyManager.finalizeStory(storyId);
      const supplyAfter = await nft.totalSupply();
      expect(supplyAfter).to.equal(supplyBefore + 1n);

      const creatorTokenId = supplyAfter;
      const creatorData = await nft.getNFTData(creatorTokenId);
      expect(creatorData.isCreatorNFT).to.equal(true);
      expect(creatorData.storyId).to.equal(storyId);

      // Second finalize attempt must revert
      await expect(storyManager.finalizeStory(storyId)).to.be.reverted;
    });
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
