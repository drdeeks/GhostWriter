"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStory = void 0;
var types_1 = require("../../types/ghostwriter");
var utils_1 = require("./utils");
var seeds_1 = require("./seeds");

/**
 * Story Factory
 *
 * Generates deterministic Story objects for testing.
 */

/**
 * Create a deterministic story
 * @param config - Factory configuration
 * @param options - Story generation options
 * @param index - Optional index for multiple stories
 * @returns FactoryResult containing the generated Story
 */
var createStory = function (config, options, index) {
    if (options === void 0) { options = {}; }
    if (index === void 0) { index = 0; }
    var seed = (0, seeds_1.getSeedForStory)(config, index);
    var random = (0, utils_1.createDeterministicRandom)(seed);
    
    // Merge options with defaults
    var storyType = options.storyType || 'normal';
    var category = options.category || 'random';
    var creatorAddress = options.creatorAddress || "0x" + Array(40).fill(0).map(function (_, i) { return Math.floor(i / 4).toString(16); }).join('');
    var filledSlots = options.filledSlots || 0;
    var status = options.status || 'active';
    var completedAt = options.completedAt || null;
    
    // Get story type info
    var storyTypeInfo = types_1.STORY_TYPE_INFO[storyType];
    var totalSlots = storyTypeInfo.playerSlots;
    
    // Generate slot details
    var slotDetails = [];
    for (var i = 0; i < totalSlots; i++) {
        var isFilled = i < filledSlots;
        var wordTypeKeys = Object.keys(types_1.WORD_TYPE_DEFINITIONS);
        var wordType = wordTypeKeys[random(0, wordTypeKeys.length - 1)];
        
        slotDetails.push({
            position: i + 1,
            wordType: wordType,
            required: true,
            filled: isFilled,
            word: isFilled ? "word_" + (i + 1) : null,
            contributor: isFilled ? "0x" + Array(40).fill(0).map(function (_, j) { return Math.floor((i + j) / 4).toString(16); }).join('') : null,
            nftId: isFilled ? "nft_" + (0, utils_1.generateDeterministicId)(seed + i, 'nft_') : null,
            timestamp: isFilled ? (0, utils_1.getDeterministicPastDate)(seed + i, random(1, 7)) : null
        });
    }
    
    // Select category if random
    if (category === 'random') {
        var categories = Object.keys(types_1.CATEGORY_INFO);
        category = categories[random(0, categories.length - 1)];
    }
    
    // Generate story template based on story type
    var template = generateStoryTemplate(storyType, category, seed);
    
    return {
        data: {
            storyId: (0, utils_1.generateDeterministicId)(seed, 'story_'),
            title: "Story #" + (index + 1) + " - " + storyType + " " + category,
            template: template,
            storyType: storyType,
            category: category,
            totalSlots: totalSlots,
            filledSlots: filledSlots,
            slotDetails: slotDetails,
            creator: creatorAddress,
            createdAt: (0, utils_1.getDeterministicPastDate)(seed, 7),
            completedAt: completedAt || (status === 'complete' ? (0, utils_1.getDeterministicPastDate)(seed, 1) : null),
            status: status,
            completionTimestamp: status === 'complete' ? (0, utils_1.getDeterministicPastDate)(seed, 1) : null,
            shareCount: random(0, 100)
        },
        config: config
    };
};
exports.createStory = createStory;

/**
 * Generate a story template based on story type and category
 * @param storyType - Type of story
 * @param category - Story category
 * @param seed - Seed value
 * @returns Generated story template
 */
function generateStoryTemplate(storyType, category, seed) {
    var random = (0, utils_1.createDeterministicRandom)(seed);
    var wordTypes = Object.keys(types_1.WORD_TYPE_DEFINITIONS);
    var slots = types_1.STORY_TYPE_INFO[storyType].playerSlots;
    
    var template = "Once upon a time, in a [" + wordTypes[random(0, wordTypes.length - 1)] + "] " + category + " land, there was a ";
    
    for (var i = 1; i < slots; i++) {
        template += "[" + wordTypes[random(0, wordTypes.length - 1)] + "] ";
        if (i % 5 === 0) {
            template += "\n";
        }
    }
    
    template += ". The end.";
    return template;
}