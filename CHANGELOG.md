# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2025-01-10

### Added
- **AI-Powered Word Moderation:** Integrated OpenAI Moderation API for intelligent content filtering. The system checks words for profanity, hate speech, violence, and other inappropriate content before allowing contributions.
- **AI-Powered Story Generation:** Implemented OpenAI GPT-4o-mini integration for dynamic story template generation. Stories are now generated on-demand based on selected categories, replacing static templates.
- **Farcaster User API:** Created new API endpoint `/api/farcaster-user` to fetch Farcaster user information (FID and username) from wallet addresses for creator NFT metadata.
- **Minimal Creator NFT Metadata:** Updated creator NFT metadata to include only essential information: user name/FID, story title, category, and date created. Removed story template/content from creator NFTs as specified.
- **Enhanced NFT Image Generation:** Updated NFT image generation to dynamically create SVG images for creator NFTs with proper branding, creator information, category, and creation date.
- **AI Integration Documentation:** Created comprehensive `docs/AI_INTEGRATION.md` guide explaining AI features, API usage, configuration, and cost considerations.

### Changed
- **Word Moderation API:** Upgraded from basic `bad-words` library to OpenAI Moderation API with detailed category scoring and fallback mechanisms.
- **Story Generation API:** Enhanced to use OpenAI GPT-4o-mini for dynamic story creation while maintaining template-based fallback for cost optimization.
- **Creator NFT Metadata Structure:** Simplified creator NFT metadata to only include: creator name/FID, story title, category (Normal/Epic), and date created. Removed all story content and template information.
- **NFT Image Route:** Completely rewrote `/api/nft/[tokenId]/image` to generate proper SVG images for both creator and contributor NFTs with distinct designs.
- **Environment Configuration:** Added `OPENAI_API_KEY` to `env.example` with documentation.

### Fixed
- **OpenAI Client Initialization:** Fixed build errors by implementing lazy initialization of OpenAI client to prevent module-level instantiation during build time.
- **Creator NFT Display:** Ensured creator NFTs display only required metadata fields as specified, removing unnecessary story content.

### Technical Details
- AI features include fallback mechanisms: word moderation falls back to basic validation, story generation falls back to template-based system if OpenAI API key is not configured.
- Creator NFT auto-minting occurs automatically when stories are completed via the `_completeStory` function in `StoryManager.sol`.
- Farcaster user lookup is implemented as a placeholder API ready for integration with Farcaster's official API or Neynar service.
- All AI endpoints use lazy client initialization to support builds without API keys configured.

## [1.2.1] - 2025-01-10

### Added
- **Postinstall Script:** Created `scripts/postinstall.js` to automatically generate wagmi/experimental compatibility shim after npm install, ensuring consistent builds across all environments.
- **Wagmi Experimental Shim Documentation:** Added comprehensive documentation in `docs/WAGMI_EXPERIMENTAL_SHIM.md` explaining the compatibility shim, its purpose, usage, and troubleshooting.
- **Vercel Deployment Documentation:** Created `docs/VERCEL_DEPLOYMENT.md` with deployment configuration details, environment variables, and troubleshooting guide.
- **Vercel Configuration:** Added `vercel.json` with optimized build settings, install command with legacy peer deps, and API route timeout configuration.
- **PostCSS Dependency:** Added `@tailwindcss/postcss` as a dev dependency to support Tailwind CSS v4 PostCSS processing.
- **TypeScript Type Definitions:** Added `@types/react` and `@types/react-dom` (v19.2.3) to dev dependencies for proper TypeScript support with React 19.

### Changed
- **Package.json Scripts:** Added `postinstall` script to automatically run the wagmi/experimental shim creation after dependency installation.
- **TypeScript Configuration:** Updated `tsconfig.json` to exclude Hardhat scripts, test files, and contracts from Next.js build process, preventing type conflicts.
- **Next.js Configuration:** Enhanced `next.config.js` with webpack alias for `wagmi/experimental` as a fallback mechanism for module resolution.
- **Bad Words Import:** Changed from default import to named import (`import { Filter } from 'bad-words'`) to match the package's export structure.

### Fixed
- **Build Errors - Missing PostCSS:** Resolved build failure caused by missing `@tailwindcss/postcss` dependency required for Tailwind CSS v4.
- **Wagmi Experimental Module Resolution:** Fixed "Cannot find module 'wagmi/experimental'" errors by creating compatibility shim that re-exports experimental hooks from wagmi v3 main package.
- **Bad Words Import Error:** Fixed "Export default doesn't exist" error by switching to named import syntax.
- **TypeScript Compilation Conflicts:** Resolved TypeScript errors during Next.js build by excluding Hardhat-specific files from Next.js TypeScript compilation.
- **Missing Type Definitions:** Added missing TypeScript type definitions for React 19 to ensure proper type checking.
- **Package Lock File:** Regenerated `package-lock.json` to include all updated dependencies and ensure consistent installs across environments.

### Technical Details
- The wagmi/experimental shim is automatically created via postinstall script, ensuring compatibility between `@coinbase/onchainkit` v1.1.2 (which expects wagmi/experimental) and wagmi v3.1.4 (which exports experimental features from the main package).
- All build issues have been resolved, and the project now builds successfully with all components functional.
- Vercel deployment is configured to use `--legacy-peer-deps` flag to handle peer dependency conflicts gracefully.

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
