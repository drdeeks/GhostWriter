"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContractState = void 0;
var utils_1 = require("./utils");
var seeds_1 = require("./seeds");

/**
 * Contract Factory
 *
 * Generates deterministic contract states for testing.
 */

/**
 * Create deterministic contract state
 * @param config - Factory configuration
 * @param options - Contract generation options
 * @param index - Optional index for multiple contract states
 * @returns FactoryResult containing the generated contract state
 */
var createContractState = function (config, options, index) {
    if (options === void 0) { options = {}; }
    if (index === void 0) { index = 0; }
    var seed = (0, seeds_1.getSeedForContract)(config, index);
    var random = (0, utils_1.createDeterministicRandom)(seed);
    
    // Merge options with defaults
    var storyCount = options.storyCount || random(0, 100);
    var completedStoryCount = options.completedStoryCount || random(0, storyCount);
    var totalContributions = options.totalContributions || random(0, 1000);
    
    return {
        data: {
            storyManager: {
                address: "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor((seed + i) / 4).toString(16); }).join(''),
                storyCount: storyCount,
                completedStoryCount: completedStoryCount,
                totalContributions: totalContributions,
                activeStories: random(0, storyCount - completedStoryCount),
                lastUpdated: (0, utils_1.getDeterministicPastDate)(seed, random(1, 30))
            },
            liquidityPool: {
                address: "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor((seed + i + 10) / 4).toString(16); }).join(''),
                totalDeposited: "" + random(1000, 1000000) + "000000000000000000", // 1000-1M ETH with 18 decimals
                availableLiquidity: "" + random(500, 500000) + "000000000000000000", // 500-500k ETH with 18 decimals
                lastDeposit: (0, utils_1.getDeterministicPastDate)(seed, random(1, 7))
            },
            priceOracle: {
                address: "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor((seed + i + 20) / 4).toString(16); }).join(''),
                currentPrice: "" + random(5, 50) + "0000000000000000", // $0.05-$0.50 with 18 decimals
                lastUpdated: (0, utils_1.getDeterministicPastDate)(seed, 1)
            },
            nftContract: {
                address: "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor((seed + i + 30) / 4).toString(16); }).join(''),
                totalSupply: random(0, 10000),
                lastMinted: (0, utils_1.getDeterministicPastDate)(seed, random(1, 3))
            }
        },
        config: config
    };
};
exports.createContractState = createContractState;