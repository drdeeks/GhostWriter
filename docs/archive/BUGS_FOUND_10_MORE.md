# 🐛 Bug Report - 10 MORE Bugs Found

**Date**: 2026-01-16  
**Status**: All bugs identified and documented

---

## Bug #31: revealStoryNFTs Reverts if Any NFT Already Revealed
**Severity**: HIGH  
**File**: `contracts/GhostWriterNFT.sol`  
**Line**: 189

**Issue**: The loop checks `require(!data.revealed, "Story already revealed")` for EACH token. If even one NFT is already revealed, the entire transaction reverts, preventing all other NFTs from being revealed.

**Impact**: 
- Story completion can be permanently blocked
- If one NFT is revealed early (bug/admin action), entire story stuck
- DoS attack vector

**Fix**: Change to `if (data.revealed) continue;` instead of require

---

## Bug #32: No Validation for Empty storyTitle in mintHiddenNFT
**Severity**: MEDIUM  
**File**: `contracts/GhostWriterNFT.sol`  
**Line**: 107

**Issue**: Function validates `storyId` but not `storyTitle`. Empty titles can be minted.

**Impact**:
- NFTs with empty titles
- Poor UX
- Metadata issues

**Fix**: Add `require(bytes(storyTitle).length > 0, "Invalid title")`

---

## Bug #33: No Validation for Empty wordType in mintHiddenNFT
**Severity**: MEDIUM  
**File**: `contracts/GhostWriterNFT.sol`  
**Line**: 107

**Issue**: `wordType` parameter is not validated. Empty word types can be stored.

**Impact**:
- Confusing NFT metadata
- Users don't know what word to contribute
- Game logic breaks

**Fix**: Add `require(bytes(wordType).length > 0, "Invalid word type")`

---

## Bug #34: emergencyWithdraw Uses transfer() Instead of call()
**Severity**: HIGH  
**File**: `contracts/StoryManager.sol`  
**Line**: 748

**Issue**: Uses `transfer()` which has 2300 gas limit. If owner is a contract with expensive fallback, withdrawal fails permanently.

**Impact**:
- Funds can be locked forever
- Emergency function doesn't work
- Critical security issue

**Fix**: Use `call{value: balance}("")` pattern with success check

---

## Bug #35: LiquidityPool withdraw() Uses transfer() Instead of call()
**Severity**: HIGH  
**File**: `contracts/LiquidityPool.sol`  
**Line**: 51

**Issue**: Same as Bug #34. Uses `transfer()` which can fail if owner is a contract.

**Impact**:
- Pool funds can be locked
- Withdrawal mechanism broken
- Critical for fund recovery

**Fix**: Use `call{value: amount}("")` pattern

---

## Bug #36: No Maximum Limit on Achievement Count
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 537-548

**Issue**: `achievementIds` array can grow unbounded. `getUserAchievements()` returns entire array which can cause out-of-gas.

**Impact**:
- Function fails with too many achievements
- Users can't retrieve their achievements
- DoS vector

**Fix**: Add pagination or limit achievement count

---

## Bug #37: Race Condition in contributeWord
**Severity**: MEDIUM  
**File**: `contracts/StoryManager.sol`  
**Line**: 315-430

**Issue**: Two users can submit transactions for the same slot simultaneously. Both pass the `!slot.filled` check, but only one succeeds. The other wastes gas and gets reverted.

**Impact**:
- Poor UX (wasted gas)
- Users frustrated by failed transactions
- No refund for failed attempts

**Fix**: Add better error messages or implement slot reservation system

---

## Bug #38: Frontend Timeout Promise Never Resolves
**Severity**: MEDIUM  
**File**: `src/app/page.tsx`  
**Line**: 95-96

**Issue**: `timeoutPromise` only rejects, never resolves. If `initPromise` succeeds, the timeout timer keeps running unnecessarily.

**Impact**:
- Memory leak (timer not cleared)
- Unnecessary background processes
- Performance degradation

**Fix**: Clear timeout on success: `clearTimeout(timeoutId)`

---

## Bug #39: No Validation for Duplicate Achievement IDs
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 183-189

**Issue**: `_initializeAchievements()` pushes achievement IDs but doesn't check for duplicates. If called multiple times or IDs repeated, duplicates exist.

**Impact**:
- Duplicate achievements
- Incorrect achievement counts
- Wasted storage

**Fix**: Check for duplicates before pushing or use mapping

---

## Bug #40: getLeaderboard Can Return Empty Array Without Error
**Severity**: LOW  
**File**: `contracts/StoryManager.sol`  
**Line**: 665-688

**Issue**: If `offset >= leaderboard.length`, function returns empty array. Frontend doesn't know if it's end of list or error.

**Impact**:
- Confusing UX
- Frontend can't distinguish between "no more data" and "error"
- Infinite scroll breaks

**Fix**: Revert if offset out of bounds or return metadata with `hasMore` flag

---

## Summary

| Severity | Count |
|----------|-------|
| HIGH     | 3     |
| MEDIUM   | 4     |
| LOW      | 3     |
| **Total**| **10**|

---

## Critical Issues (Must Fix Before Mainnet)

### HIGH Priority
1. **Bug #31**: revealStoryNFTs can be permanently blocked
2. **Bug #34**: emergencyWithdraw can fail permanently
3. **Bug #35**: LiquidityPool withdraw can fail permanently

### MEDIUM Priority
4. **Bug #32**: Empty story titles allowed
5. **Bug #33**: Empty word types allowed
6. **Bug #37**: Race condition wastes user gas
7. **Bug #38**: Memory leak in frontend initialization

---

## Combined Bug Count

**Previous Reports**:
- BUGS_FOUND.md: 10 bugs
- BUGS_FOUND_20_MORE.md: 20 bugs
- This report: 10 bugs

**Total Bugs Found**: **40 bugs**

---

## Recommended Actions

### Before Testnet Deployment
- Fix HIGH priority bugs (#31, #34, #35)
- Fix MEDIUM priority bugs (#32, #33, #37, #38)

### Before Mainnet Deployment
- Fix ALL bugs from all reports
- Complete security audit
- Implement comprehensive test coverage
- Add integration tests for edge cases

---

## Testing Recommendations

### For Bug #31
```solidity
// Test: Reveal story with one already-revealed NFT
// Expected: Should skip revealed NFT, reveal others
```

### For Bug #34 & #35
```solidity
// Test: Withdraw to contract with expensive fallback
// Expected: Should succeed with call() pattern
```

### For Bug #37
```solidity
// Test: Two users contribute to same slot simultaneously
// Expected: One succeeds, one gets clear error + refund
```

### For Bug #38
```typescript
// Test: Initialize with slow network
// Expected: Timeout clears on success
```

---

**Questions?** Contact drdeeks@outlook.com
