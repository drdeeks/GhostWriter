"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = void 0;
var utils_1 = require("./utils");
var seeds_1 = require("./seeds");

/**
 * Transaction Factory
 *
 * Generates deterministic transaction data for testing.
 */

/**
 * Create deterministic transaction
 * @param config - Factory configuration
 * @param options - Transaction generation options
 * @param index - Optional index for multiple transactions
 * @returns FactoryResult containing the generated transaction data
 */
var createTransaction = function (config, options, index) {
    if (options === void 0) { options = {}; }
    if (index === void 0) { index = 0; }
    var seed = (0, seeds_1.getSeedForTransaction)(config, index);
    var random = (0, utils_1.createDeterministicRandom)(seed);
    
    // Merge options with defaults
    var success = options.success !== undefined ? options.success : true;
    var creditEarned = options.creditEarned !== undefined ? options.creditEarned : false;
    var storyId = options.storyId || (0, utils_1.generateDeterministicId)(seed, 'story_');
    var contributorAddress = options.contributorAddress || "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor((seed + i) / 4).toString(16); }).join('');
    
    var transactionType = ['contribution', 'refund', 'mint'][random(0, 2)];
    var amount = random(1, 100) + "." + random(0, 99) + " ETH";
    var timestamp = (0, utils_1.getDeterministicPastDate)(seed, random(1, 30));
    
    return {
        data: {
            transactionId: (0, utils_1.generateDeterministicId)(seed, 'tx_'),
            transactionType: transactionType,
            storyId: storyId,
            contributorAddress: contributorAddress,
            amount: amount,
            timestamp: timestamp,
            blockNumber: random(1000000, 10000000),
            transactionHash: "0x" + Array(64).fill(0).map(function (_, i) { return Math.floor((seed + i) / 2).toString(16); }).join(''),
            success: success,
            creditEarned: creditEarned,
            nftId: transactionType === 'contribution' || transactionType === 'mint' ? (0, utils_1.generateDeterministicId)(seed, 'nft_') : undefined,
            message: success ? "Transaction successful" : "Transaction failed: " + ['Insufficient funds', 'Invalid word', 'Story completed', 'Network error'][random(0, 3)]
        },
        config: config
    };
};
exports.createTransaction = createTransaction;