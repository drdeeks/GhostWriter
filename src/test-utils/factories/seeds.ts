"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSeedForStory = exports.getSeedForUser = exports.getSeedForNFT = exports.getSeedForTransaction = exports.getSeedForContract = exports.DEFAULT_SEEDS = void 0;

/**
 * Test Data Factory Seeds
 *
 * Manages deterministic seed values for reproducible test data generation.
 */

/**
 * Default seed values for different factory types
 */
exports.DEFAULT_SEEDS = {
    STORY: 12345,
    NFT: 67890,
    USER: 24680,
    CONTRACT: 13579,
    TRANSACTION: 98765,
    GLOBAL: 42
};

/**
 * Get seed for contract factory
 * @param config - Factory configuration
 * @param index - Optional index for multiple contracts
 * @returns Seed value
 */
var getSeedForContract = function (config, index) {
    if (index === void 0) { index = 0; }
    return config.seed + exports.DEFAULT_SEEDS.CONTRACT + index;
};
exports.getSeedForContract = getSeedForContract;

/**
 * Get seed for transaction factory
 * @param config - Factory configuration
 * @param index - Optional index for multiple transactions
 * @returns Seed value
 */
var getSeedForTransaction = function (config, index) {
    if (index === void 0) { index = 0; }
    return config.seed + exports.DEFAULT_SEEDS.TRANSACTION + index;
};
exports.getSeedForTransaction = getSeedForTransaction;

/**
 * Get seed for NFT factory
 * @param config - Factory configuration
 * @param index - Optional index for multiple NFTs
 * @returns Seed value
 */
var getSeedForNFT = function (config, index) {
    if (index === void 0) { index = 0; }
    return config.seed + exports.DEFAULT_SEEDS.NFT + index;
};
exports.getSeedForNFT = getSeedForNFT;

/**
 * Get seed for user factory
 * @param config - Factory configuration
 * @param index - Optional index for multiple users
 * @returns Seed value
 */
var getSeedForUser = function (config, index) {
    if (index === void 0) { index = 0; }
    return config.seed + exports.DEFAULT_SEEDS.USER + index;
};
exports.getSeedForUser = getSeedForUser;

/**
 * Get seed for story factory
 * @param config - Factory configuration
 * @param index - Optional index for multiple stories
 * @returns Seed value
 */
var getSeedForStory = function (config, index) {
    if (index === void 0) { index = 0; }
    return config.seed + exports.DEFAULT_SEEDS.STORY + index;
};
exports.getSeedForStory = getSeedForStory;