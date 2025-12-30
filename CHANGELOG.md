# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2024-07-26

### Added
- **Dynamic Fees:** Implemented a dynamic fee mechanism in `StoryManager.sol` that allows the contract owner to set contribution and creation fees.
- **Admin-Only Epic Stories:** Restricted the creation of `EPIC` stories to the contract owner, ensuring this functionality is accessible only through the admin console.
- **Creator NFTs for All:** Updated the `_completeStory` function to mint creator NFTs for all story creators upon completion, not just the contract owner.
- **Active Contribution Tracking:** Added a new `activeContributions` mapping to the `UserStats` struct to track the stories a user has contributed to.
- **Word Moderation API:** Created a new API route `api/moderate-word` to handle word moderation, checking for profanity and crude language.
- **Story Generation API:** Developed a new API route `api/generate-story` to generate story templates, replacing the hardcoded templates with dynamically generated content.
- **Active Stories Count Hook:** Introduced a new `activeStoriesCount` hook to efficiently retrieve the number of active stories from the `StoryManager` contract.
- **Admin Console Component:** Created a new `admin-console` component to centralize administrative functionalities.
- **Profanity Filter Test Suite:** Added a new test file `test/ProfanityFilter.test.ts` to thoroughly test the profanity filter middleware.
- **AI Generation Test Suite:** Developed a dedicated test suite `test/AIGeneration.test.ts` to validate the AI-powered story generation functionality.
- **End-to-End Test Case:** Added a comprehensive end-to-end test case to `test/StoryManagerExpansion.test.ts` that validates the entire story lifecycle.
- **New Documentation:** Created a new `docs` directory and added a file named `INSTRUCTIONS.md`. This file will contain detailed instructions on how to acquire and set up the necessary AI API keys and how to configure the NFT autogeneration process.

### Changed
- **UserStatsDisplay Component:** Updated the `UserStatsDisplay` component to eliminate all `TODO` comments and placeholder data, ensuring it now accurately reflects on-chain user statistics.
- **StoryCreationModal Component:** Enhanced the `StoryCreationModal` by integrating the `generate-story` API for dynamic story creation, adding a new `epic` story type for admins, and removing the hardcoded story templates.
- **ContributionModal Component:** Updated the `ContributionModal` to use the `moderate-word` API for real-time content moderation.
- **GhostWriter.test.ts:** Expanded the `GhostWriter.test.ts` file by adding new test cases that cover all the new functionalities.
- **StoryManagerExpansion.test.ts:** Enhanced the `StoryManagerExpansion.test.ts` file by adding comprehensive tests for the new leaderboard and achievement functionalities.

### Removed
- **Hardcoded Story Templates:** Removed the `aiStoryTemplates.ts` file, which contained hardcoded story templates, in favor of the new `generate-story` API.
- **updateFees Function:** Removed the `updateFees` function from `StoryManager.sol`, which was a placeholder and has been replaced by the new `setFee` function.

### Fixed
- **Leaderboard Update Gas Inefficiency:** Optimized the `_updateLeaderboard` function in `StoryManager.sol` by replacing the gas-intensive bubble sort with a more efficient insertion sort algorithm.
- **Story Completion Logic:** Added a requirement to the `_completeStory` function in `StoryManager.sol` to ensure that only active stories can be completed.
- **Leaderboard Offset Validation:** Added a check to the `getLeaderboard` function in `StoryManager.sol` to ensure that the `offset` is always less than the length of the leaderboard.
- **User Rank Handling:** Modified the `getUserRank` function in `StoryManager.sol` to return `0` if the user is not on the leaderboard.
- **Emergency Withdrawal Event:** Added an event to the `emergencyWithdraw` function in `StoryManager.sol` to ensure that all emergency withdrawals are properly logged.
- **Dependency Conflict:** Resolved a dependency conflict between `@coinbase/onchainkit` and `wagmi` by downgrading `@coinbase/onchainkit` to a compatible version.
