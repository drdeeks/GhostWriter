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

  describe("Protocol config + admin controls", function () {
    it("Should allow owner to update maxActiveStories and enforce the limit", async function () {
      await expect(storyManager.connect(user1).setMaxActiveStories(5)).to.be.reverted;

      await storyManager.connect(owner).setMaxActiveStories(1);
      expect(await storyManager.maxActiveStories()).to.equal(1);

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

      // Give user1 enough credits to create 2 stories
      await storyManager.airdropCredits([user1.address], [2]);
      const creationFee = await storyManager.getCreationFee();

      const latestBlock = await ethers.provider.getBlock("latest");
      const expiresAt = BigInt(latestBlock.timestamp + 60 * 60);

      const sig1 = await signCreateStory({
        signer: owner,
        creator: user1.address,
        storyId: "story_limit_1",
        title: "Limit 1",
        template: "Test [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER].",
        storyType: 0,
        category: 0,
        wordTypes,
        expiresAt,
      });

      await storyManager.connect(user1).createStoryApproved(
        "story_limit_1",
        "Limit 1",
        "Test [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER].",
        0,
        0,
        wordTypes,
        expiresAt,
        sig1,
        { value: creationFee }
      );

      // Second story should revert due to active story cap
      const sig2 = await signCreateStory({
        signer: owner,
        creator: user1.address,
        storyId: "story_limit_2",
        title: "Limit 2",
        template: "Test [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER].",
        storyType: 0,
        category: 0,
        wordTypes,
        expiresAt,
      });

      await expect(
        storyManager.connect(user1).createStoryApproved(
          "story_limit_2",
          "Limit 2",
          "Test [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER].",
          0,
          0,
          wordTypes,
          expiresAt,
          sig2,
          { value: creationFee }
        )
      ).to.be.reverted;

      // Reset cap so other tests are not affected (fresh beforeEach already, but keep explicit)
      await storyManager.connect(owner).setMaxActiveStories(15);
    });

    it("Should allow owner to force-complete a story even if unfilled", async function () {
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

      const storyId = "story_force_complete";
      const title = "Force Complete";
      const template = "Test [ADJECTIVE] [NOUN] [VERB] [ADVERB] [PLURAL_NOUN] [PAST_TENSE_VERB] [VERB_ING] [PERSONS_NAME] [PLACE] [NUMBER].";

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

      await expect(storyManager.connect(user1).forceCompleteStory(storyId)).to.be.reverted;
      await expect(storyManager.connect(owner).forceCompleteStory(storyId)).to.not.be.reverted;

      const story = await storyManager.getStory(storyId);
      // status enum: ACTIVE=0, COMPLETE=1
      expect(story.status).to.equal(1);
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

  describe("Token supply cap + buckets", function () {
    it("Should enforce per-bucket caps and a global 50,000,000 max supply", async function () {
      const GhostWriterToken = await ethers.getContractFactory("GhostWriterToken");
      const token = await GhostWriterToken.deploy();

      // Configure bucket 0 cap to 100 tokens
      await token.setBucketCap(0, ethers.parseUnits("100", 18));

      // Mint 60 tokens
      await token.mintFromBucket(0, user1.address, ethers.parseUnits("60", 18));
      expect(await token.totalSupply()).to.equal(ethers.parseUnits("60", 18));

      // Exceed cap
      await expect(
        token.mintFromBucket(0, user1.address, ethers.parseUnits("50", 18))
      ).to.be.reverted;

      // Caps sum must not exceed MAX_SUPPLY
      const max = await token.MAX_SUPPLY();
      await token.setBucketCap(1, max - ethers.parseUnits("100", 18));

      // This would push total caps over max
      await expect(token.setBucketCap(2, 1n)).to.be.reverted;
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
