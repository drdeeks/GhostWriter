"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * Test Data Factory Types
 *
 * Defines the core types and interfaces for the test data factory system.
 */

/**
 * Factory Configuration
 */
exports.FactoryConfig = void 0;
var FactoryConfig = /** @class */ (function () {
    function FactoryConfig(seed, version) {
        if (seed === void 0) { seed = 42; }
        if (version === void 0) { version = '1.0'; }
        this.seed = seed;
        this.version = version;
        this.timestamp = Date.now();
    }
    return FactoryConfig;
}());
exports.FactoryConfig = FactoryConfig;

/**
 * Factory Result
 */
exports.FactoryResult = void 0;
var FactoryResult = /** @class */ (function () {
    function FactoryResult(data, config) {
        this.data = data;
        this.config = config;
        this.generatedAt = new Date().toISOString();
    }
    return FactoryResult;
}());
exports.FactoryResult = FactoryResult;

/**
 * Factory Error
 */
exports.FactoryError = void 0;
var FactoryError = /** @class */ (function () {
    function FactoryError(message, code, details) {
        this.message = message;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
    return FactoryError;
}());
exports.FactoryError = FactoryError;

/**
 * Story Factory Options
 */
exports.StoryFactoryOptions = void 0;
var StoryFactoryOptions = /** @class */ (function () {
    function StoryFactoryOptions() {
        this.storyType = 'normal';
        this.category = 'random';
        this.creatorAddress = '';
        this.filledSlots = 0;
        this.status = 'active';
        this.completedAt = null;
    }
    return StoryFactoryOptions;
}());
exports.StoryFactoryOptions = StoryFactoryOptions;

/**
 * NFT Factory Options
 */
exports.NFTFactoryOptions = void 0;
var NFTFactoryOptions = /** @class */ (function () {
    function NFTFactoryOptions() {
        this.status = 'hidden';
        this.storyComplete = false;
        this.contributorAddress = '';
    }
    return NFTFactoryOptions;
}());
exports.NFTFactoryOptions = NFTFactoryOptions;

/**
 * User Factory Options
 */
exports.UserFactoryOptions = void 0;
var UserFactoryOptions = /** @class */ (function () {
    function UserFactoryOptions() {
        this.contributionsCount = 0;
        this.storiesCreated = 0;
        this.nftsOwned = 0;
        this.completedStories = 0;
    }
    return UserFactoryOptions;
}());
exports.UserFactoryOptions = UserFactoryOptions;

/**
 * Contract Factory Options
 */
exports.ContractFactoryOptions = void 0;
var ContractFactoryOptions = /** @class */ (function () {
    function ContractFactoryOptions() {
        this.storyCount = 0;
        this.completedStoryCount = 0;
        this.totalContributions = 0;
    }
    return ContractFactoryOptions;
}());
exports.ContractFactoryOptions = ContractFactoryOptions;

/**
 * Transaction Factory Options
 */
exports.TransactionFactoryOptions = void 0;
var TransactionFactoryOptions = /** @class */ (function () {
    function TransactionFactoryOptions() {
        this.success = true;
        this.creditEarned = false;
    }
    return TransactionFactoryOptions;
}());
exports.TransactionFactoryOptions = TransactionFactoryOptions;