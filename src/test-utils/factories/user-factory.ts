"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserProfile = void 0;
var types_1 = require("../../types/ghostwriter");
var utils_1 = require("./utils");
var seeds_1 = require("./seeds");

/**
 * User Factory
 *
 * Generates deterministic user profiles for testing.
 */

/**
 * Create a deterministic user profile
 * @param config - Factory configuration
 * @param options - User generation options
 * @param index - Optional index for multiple users
 * @returns FactoryResult containing the generated UserStats
 */
var createUserProfile = function (config, options, index) {
    if (options === void 0) { options = {}; }
    if (index === void 0) { index = 0; }
    var seed = (0, seeds_1.getSeedForUser)(config, index);
    var random = (0, utils_1.createDeterministicRandom)(seed);
    
    // Merge options with defaults
    var contributionsCount = options.contributionsCount || random(0, 100);
    var storiesCreated = options.storiesCreated || random(0, 10);
    var nftsOwned = options.nftsOwned || random(0, 50);
    var completedStories = options.completedStories || random(0, 20);
    
    // Generate achievements
    var achievements = {};
    Object.keys(types_1.ACHIEVEMENT_DEFINITIONS).forEach(function (key) {
        achievements[key] = {
            id: key,
            name: types_1.ACHIEVEMENT_DEFINITIONS[key].name,
            description: types_1.ACHIEVEMENT_DEFINITIONS[key].description,
            icon: types_1.ACHIEVEMENT_DEFINITIONS[key].icon,
            unlocked: random(0, 1) === 1,
            unlockedAt: random(0, 1) === 1 ? (0, utils_1.getDeterministicPastDate)(seed, random(1, 30)) : undefined
        };
    });
    
    // Generate active contributions
    var activeContributions = [];
    var activeCount = random(0, Math.min(5, contributionsCount));
    for (var i = 0; i < activeCount; i++) {
        activeContributions.push({
            storyId: (0, utils_1.generateDeterministicId)(seed + i, 'story_'),
            position: random(1, 20),
            nftId: (0, utils_1.generateDeterministicId)(seed + i, 'nft_')
        });
    }
    
    return {
        data: {
            address: "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor((seed + i) / 4).toString(16); }).join(''),
            contributionsCount: contributionsCount,
            creationCredits: random(0, 10),
            storiesCreated: storiesCreated,
            nftsOwned: nftsOwned,
            completedStories: completedStories,
            shareCount: random(0, 50),
            lastContributionTime: Date.now() - random(0, 86400000 * 30), // Up to 30 days ago
            activeContributions: activeContributions
        },
        config: config
    };
};
exports.createUserProfile = createUserProfile;