"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFakerInstance = exports.createDeterministicRandom = exports.validateAddress = exports.generateDeterministicId = exports.getDeterministicFutureDate = exports.getDeterministicPastDate = exports.getDeterministicDate = void 0;
const faker_1 = require("@faker-js/faker");

/**
 * Test Data Factory Utilities
 *
 * Core utility functions for deterministic data generation.
 */

/***
 * Get a deterministic date based on seed
 * @param seed - The seed value
 * @param daysOffset - Number of days to offset from current date
 * @returns ISO date string
 */
const getDeterministicDate = (seed, daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    // Apply deterministic variation based on seed
    date.setHours(seed % 24);
    date.setMinutes((seed * 13) % 60);
    date.setSeconds((seed * 47) % 60);
    return date.toISOString();
};
exports.getDeterministicDate = getDeterministicDate;

/**
 * Get a deterministic past date
 * @param seed - The seed value
 * @param daysAgo - Number of days in the past
 * @returns ISO date string
 */
const getDeterministicPastDate = (seed, daysAgo = 7) => {
    return (0, exports.getDeterministicDate)(seed, -daysAgo);
};
exports.getDeterministicPastDate = getDeterministicPastDate;

/**
 * Get a deterministic future date
 * @param seed - The seed value
 * @param daysAhead - Number of days in the future
 * @returns ISO date string
 */
const getDeterministicFutureDate = (seed, daysAhead = 7) => {
    return (0, exports.getDeterministicDate)(seed, daysAhead);
};
exports.getDeterministicFutureDate = getDeterministicFutureDate;

/**
 * Generate a deterministic ID based on seed
 * @param seed - The seed value
 * @param prefix - Optional prefix for the ID
 * @returns Deterministic ID string
 */
const generateDeterministicId = (seed, prefix = '') => {
    const hash = seed.toString(16).padStart(8, '0');
    return `${prefix}${hash}`;
};
exports.generateDeterministicId = generateDeterministicId;

/**
 * Validate Ethereum address format
 * @param address - The address to validate
 * @returns True if valid address format
 */
const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};
exports.validateAddress = validateAddress;

/**
 * Create a deterministic random number generator
 * @param seed - The seed value
 * @returns Function that generates deterministic random numbers
 */
const createDeterministicRandom = (seed) => {
    const m = 0x80000000;
    const a = 1103515245;
    const c = 12345;
    let state = seed % m;
    return (min = 0, max = 1) => {
        state = (a * state + c) % m;
        return min + Math.floor((state / m) * (max - min + 1));
    };
};
exports.createDeterministicRandom = createDeterministicRandom;

/**
 * Create a deterministic Faker instance
 * @param seed - The seed value
 * @returns Configured Faker instance
 */
const createFakerInstance = (seed) => {
    const faker = new faker_1.Faker({
        locale: [faker_1.en, faker_1.base]
    });
    faker.seed(seed);
    return faker;
};
exports.createFakerInstance = createFakerInstance;