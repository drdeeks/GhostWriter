"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNFTMetadata = void 0;
var utils_1 = require("./utils");
var seeds_1 = require("./seeds");

/**
 * NFT Factory
 *
 * Generates deterministic NFT metadata for testing.
 */

/**
 * Create deterministic NFT metadata
 * @param config - Factory configuration
 * @param options - NFT generation options
 * @param index - Optional index for multiple NFTs
 * @returns FactoryResult containing the generated NFTMetadata
 */
var createNFTMetadata = function (config, options, index) {
    if (options === void 0) { options = {}; }
    if (index === void 0) { index = 0; }
    var seed = (0, seeds_1.getSeedForNFT)(config, index);
    var random = (0, utils_1.createDeterministicRandom)(seed);
    
    // Merge options with defaults
    var status = options.status || 'hidden';
    var storyComplete = options.storyComplete || false;
    var contributorAddress = options.contributorAddress || "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor(i / 4).toString(16); }).join('');
    var storyId = options.storyId || (0, utils_1.generateDeterministicId)(seed, 'story_');
    var storyTitle = options.storyTitle || "Story #" + (index + 1);
    
    var wordPosition = random(1, 20);
    var totalWords = random(10, 35);
    var wordTypeKeys = ['adjective', 'noun', 'verb', 'adverb', 'plural_noun'];
    var wordType = wordTypeKeys[random(0, wordTypeKeys.length - 1)];
    var contributedWord = wordType + "_" + wordPosition;
    
    return {
        data: {
            nftId: (0, utils_1.generateDeterministicId)(seed, 'nft_'),
            name: "Contribution #" + (index + 1) + " - " + wordType,
            description: "Contribution to story '" + storyTitle + "' at position " + wordPosition,
            image: "/api/nft/" + (0, utils_1.generateDeterministicId)(seed, 'nft_') + "/image",
            attributes: {
                storyId: storyId,
                storyTitle: storyTitle,
                wordPosition: wordPosition,
                totalWords: totalWords,
                wordType: wordType,
                contributedWord: contributedWord,
                fullStorySnippet: storyComplete ? "Once upon a time... " + contributedWord + "... happily ever after." : undefined,
                contributionTimestamp: (0, utils_1.getDeterministicPastDate)(seed, random(1, 7)),
                contributorAddress: contributorAddress,
                completionTimestamp: storyComplete ? (0, utils_1.getDeterministicPastDate)(seed, 1) : undefined,
                status: status,
                storyComplete: storyComplete
            }
        },
        config: config
    };
};
exports.createNFTMetadata = createNFTMetadata;