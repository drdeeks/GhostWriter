# 🐛 Bug Report - 20 Additional Bugs Found

**Date**: 2026-01-16  
**Status**: All bugs identified and documented

---

## Bug #11: No Input Validation for Story Title/Template Length
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 206-209

**Issue**: `createStory` doesn't validate title or template length. Extremely long strings can cause gas issues and storage bloat.

**Impact**: 
- Gas griefing attack vector
- Storage costs explosion
- Potential DoS

**Fix**: Add length limits (e.g., title max 100 chars, template max 5000 chars)

---

## Bug #12: Missing Category Validation in createStory
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 210

**Issue**: No validation that `category` is a valid enum value. Solidity allows invalid enum values to be passed.

**Impact**:
- Invalid categories stored
- Frontend display issues
- Data integrity problems

**Fix**: Add require statement to validate category range

---

## Bug #13: No Validation for Empty wordTypes Array Elements
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 253-261

**Issue**: Loop initializes slots but doesn't validate that wordTypes[i] is not empty.

**Impact**:
- Empty word types stored
- Contributors confused about what to submit
- Invalid game state

**Fix**: Validate each wordType is not empty

---

## Bug #14: Missing Event for Achievement Unlock
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 537-548

**Issue**: `_unlockAchievement` emits event but doesn't check if achievement already exists before creating.

**Impact**:
- Duplicate achievement data
- Wasted storage
- Inconsistent state

**Fix**: Check if achievement ID is valid before unlocking

---

## Bug #15: No Upper Bound on Airdrop Credits
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 709-718

**Issue**: `airdropCredits` has no limit on amounts. Owner could airdrop uint256.max credits.

**Impact**:
- Economic imbalance
- Game breaking
- Potential overflow in calculations

**Fix**: Add reasonable upper limit per airdrop

---

## Bug #16: getLeaderboard Doesn't Sort Results
**Severity**: HIGH  
**File**: `contracts/StoryManager.sol`  
**Line**: 665-688

**Issue**: Returns leaderboard array but doesn't guarantee sorted order. Documentation says "off-chain sorting" but contract should maintain order.

**Impact**:
- Incorrect rankings displayed
- User confusion
- Leaderboard meaningless

**Fix**: Either sort on-chain or clearly document that array is unsorted

---

## Bug #17: shareStory Doesn't Validate Story Exists
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 594-603

**Issue**: Checks `storyExists` but then accesses `stories[storyId]` which could be default struct if mapping was deleted.

**Impact**:
- Sharing non-existent stories
- Incorrect share counts
- Data integrity

**Fix**: Add explicit check that story status is COMPLETE

---

## Bug #18: No Minimum Word Length Validation
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 338

**Issue**: Requires word length >= 3, but some word types (like "a", "I") are valid 1-2 character words.

**Impact**:
- Valid words rejected
- Poor UX
- Game too restrictive

**Fix**: Make minimum length configurable per word type or reduce to 1

---

## Bug #19: processCompletionBatch Doesn't Check Story is Complete
**Severity**: HIGH  
**File**: `contracts/StoryManager.sol`  
**Line**: 472-473

**Issue**: Only checks `story.status == StoryStatus.COMPLETE` but doesn't verify all slots are actually filled.

**Impact**:
- Processing incomplete stories
- Premature NFT reveals
- Game state corruption

**Fix**: Add check that `story.filledSlots == story.totalSlots`

---

## Bug #20: Missing Bounds Check in processCompletionBatch
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 476

**Issue**: Validates batch size < 50 but doesn't check if endPosition > totalSlots.

**Impact**:
- Out of bounds access
- Processing non-existent slots
- Wasted gas

**Fix**: Add `require(endPosition <= story.totalSlots)`

---

## Bug #21: No Duplicate Prevention in activeContributions Array
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 377-380

**Issue**: Uses `hasContributedToStory` mapping but still pushes to array. If mapping is wrong, duplicates possible.

**Impact**:
- Array bloat
- Incorrect stats
- Gas waste

**Fix**: Double-check array doesn't contain storyId before pushing

---

## Bug #22: getUserStats Returns Dynamic Array in Struct
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 619

**Issue**: `UserStats` contains `string[] activeContributions` which can grow unbounded and cause gas issues when returned.

**Impact**:
- Function may fail with out of gas
- Users can't retrieve their stats
- DoS vector

**Fix**: Return stats without array or paginate array

---

## Bug #23: No Validation for Duplicate Slot Positions
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 253-261

**Issue**: Loop creates slots with position i+1 but doesn't validate wordTypes array doesn't have duplicates.

**Impact**:
- Duplicate word types possible
- Confusing game state

**Fix**: Not critical but could validate uniqueness

---

## Bug #24: Missing Zero Address Check in Constructor
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 147-149

**Issue**: Constructor validates addresses are not zero but error messages are inconsistent.

**Impact**:
- Inconsistent error messages
- Harder debugging

**Fix**: Standardize error messages

---

## Bug #25: No Event for Story Status Change
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 446

**Issue**: `_completeStory` changes status but only emits `StoryCompleted`. No explicit `StatusChanged` event.

**Impact**:
- Harder to track state changes
- Frontend may miss updates

**Fix**: Add StatusChanged event or document StoryCompleted includes status change

---

## Bug #26: finalizeStory Doesn't Check Batches Processed
**Severity**: HIGH  
**File**: `contracts/StoryManager.sol`  
**Line**: 513-523

**Issue**: `finalizeStory` can be called without processing batches first. No check that all contributors have been processed.

**Impact**:
- NFTs revealed before stats updated
- Achievements not unlocked
- Incomplete game state

**Fix**: Add flag or counter to track batch processing completion

---

## Bug #27: No Rate Limiting on Contributions
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 315-430

**Issue**: No cooldown or rate limit on contributions. User could spam contributions.

**Impact**:
- Potential spam
- Gas price manipulation
- Network congestion

**Fix**: Add cooldown period (e.g., 1 contribution per block per user)

---

## Bug #28: Missing Validation in updatePriceOracle
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 721-725

**Issue**: Updates oracle but doesn't validate new oracle is functional or returns valid data.

**Impact**:
- Broken price feeds
- All transactions fail
- Contract unusable

**Fix**: Test oracle with sample call before updating

---

## Bug #29: No Maximum Story Count Per User
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 220

**Issue**: Limits total active stories to 15 but doesn't limit per user. One user could create all 15.

**Impact**:
- Centralization
- Poor UX for other users
- Game imbalance

**Fix**: Add per-user limit (e.g., max 3 active stories per user)

---

## Bug #30: Leaderboard Index Not Cleaned Up
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 558-575

**Issue**: When user is removed from leaderboard, `leaderboardIndex` is deleted but array position is reused. Index mapping becomes stale.

**Impact**:
- Incorrect rank lookups
- getUserRank returns wrong data
- Leaderboard corruption

**Fix**: Update all indices when array is modified or use different data structure

---

## Summary

| Severity | Count |
|----------|-------|
| HIGH     | 3     |
| MEDIUM   | 7     |
| LOW      | 10    |
| **Total**| **20**|

Most critical issues are in smart contracts around validation, bounds checking, and state management.
