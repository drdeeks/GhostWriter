# 🚀 Ghost Writer - Expansion Features Guide

This guide provides **detailed, step-by-step instructions** for implementing and configuring all expansion features added to Ghost Writer, including social sharing, leaderboards, achievements, story categories, and the admin dashboard.

---

## 📋 Table of Contents

1. [Leaderboard System](#1-leaderboard-system)
2. [Achievement Badges](#2-achievement-badges)
3. [Social Sharing Features](#3-social-sharing-features)
4. [Story Categories & Themes](#4-story-categories--themes)
5. [Admin Dashboard](#5-admin-dashboard)
6. [Testing Expansion Features](#6-testing-expansion-features)
7. [Common Issues & Troubleshooting](#7-common-issues--troubleshooting)

---

## 1. Leaderboard System

### Overview
The leaderboard tracks the top 1000 contributors ranked by total word contributions. It updates automatically when users contribute words to stories.

### Files Involved
- `contracts/StoryManager.sol` - On-chain leaderboard tracking
- `src/components/leaderboard.tsx` - Leaderboard UI component
- `src/app/leaderboard/page.tsx` - Leaderboard page route

### How It Works

1. **Automatic Ranking**: When a user contributes a word, the `_updateLeaderboard()` function is called in the `StoryManager` contract
2. **Top 1000 Only**: The leaderboard maintains a maximum of 1000 entries
3. **Dynamic Updates**: Rankings are recalculated on every contribution

### Contract Functions

```solidity
// Get leaderboard entries (paginated)
function getLeaderboard(uint256 offset, uint256 limit) 
    external view returns (LeaderboardEntry[] memory)

// Get user's rank on leaderboard
function getUserRank(address user) 
    external view returns (uint256)
```

### Step-by-Step Implementation

#### Step 1: Deploy Updated Contracts

```bash
# Compile contracts with leaderboard features
pnpm compile

# Run tests to verify leaderboard logic
pnpm test

# Deploy to Base Sepolia testnet
pnpm deploy:baseSepolia
```

#### Step 2: Update Environment Variables

After deployment, add the new contract addresses to `.env`:

```env
NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x... # Your deployed StoryManager address
```

#### Step 3: Access the Leaderboard

Users can access the leaderboard by:
1. Navigating to `/leaderboard` in the app
2. Clicking the "View Leaderboard" button on the homepage

#### Step 4: Customizing Display

To customize the leaderboard display, edit `src/components/leaderboard.tsx`:

```typescript
// Change entries per page (currently 50)
const entriesPerPage = 50; // Modify this value

// Customize rank badges
const getRankBadgeColor = (rank: number) => {
  if (rank <= 10) return 'bg-gradient-to-r from-yellow-400 to-orange-500'; // Top 10
  if (rank <= 50) return 'bg-gradient-to-r from-purple-400 to-blue-500';   // Top 50
  if (rank <= 100) return 'bg-gradient-to-r from-blue-400 to-indigo-500';  // Top 100
  return 'bg-gradient-to-r from-gray-400 to-gray-500';
};
```

### Testing the Leaderboard

1. **Create test accounts** with different contribution counts
2. **Contribute words** from multiple accounts
3. **Verify ranking** is correct based on contribution count
4. **Test pagination** (if more than 50 users)
5. **Check user's own rank** displays correctly

---

## 2. Achievement Badges

### Overview
Users earn achievement badges for milestones like first contribution, creating stories, completing stories quickly, etc.

### Available Achievements

| Achievement | ID | Criteria | Icon |
|-------------|-----|----------|------|
| **First Word** | `first_word` | Contribute your first word | ✍️ |
| **Story Starter** | `story_starter` | Create your first story | 📖 |
| **Completion King** | `completion_king` | Contribute final word to 5 stories | 👑 |
| **Prolific Writer** | `prolific_writer` | Contribute to 50+ stories | 🏆 |
| **Speed Demon** | `speed_demon` | Story you created completes in <24 hours | ⚡ |
| **Night Owl** | `night_owl` | Contribute between 12am-6am | 🦉 |

### Files Involved
- `contracts/StoryManager.sol` - Achievement tracking logic
- `src/components/achievement-badges.tsx` - Achievement display component
- `src/types/ghostwriter.ts` - Achievement definitions

### How Achievements are Unlocked

Achievements are automatically unlocked by the smart contract when criteria are met:

```solidity
// Example: First Word achievement
if (userStats[msg.sender].contributionsCount == 1) {
    _unlockAchievement(msg.sender, "first_word", "First Word", "Contributed your first word");
}
```

### Contract Functions

```solidity
// Get all achievements for a user
function getUserAchievements(address user) 
    external view returns (Achievement[] memory)

// Check achievement count
mapping(address => uint256) public achievementCount;
```

### Step-by-Step Implementation

#### Step 1: Displaying Achievements

To display user achievements, use the `AchievementBadges` component:

```typescript
import { AchievementBadges } from '@/components/achievement-badges';

// In your component
const achievements = await readContract({
  address: STORY_MANAGER_ADDRESS,
  abi: StoryManagerABI,
  functionName: 'getUserAchievements',
  args: [userAddress]
});

<AchievementBadges achievements={achievements} />
```

#### Step 2: Adding New Achievements

To add a new achievement:

1. **Update the contract** (`contracts/StoryManager.sol`):

```solidity
// Add achievement ID in constructor
function _initializeAchievements() internal {
    achievementIds.push("first_word");
    achievementIds.push("story_starter");
    // ... existing achievements ...
    achievementIds.push("new_achievement_id"); // Add your new achievement
}

// Add unlock logic where appropriate
if (/* your criteria */) {
    _unlockAchievement(
        msg.sender,
        "new_achievement_id",
        "Achievement Name",
        "Description of achievement"
    );
}
```

2. **Update types** (`src/types/ghostwriter.ts`):

```typescript
export const ACHIEVEMENT_DEFINITIONS: Record<string, Achievement> = {
  // ... existing achievements ...
  new_achievement_id: {
    id: 'new_achievement_id',
    name: 'Achievement Name',
    description: 'Description of achievement',
    icon: '🎯', // Choose an emoji icon
    unlocked: false,
  },
};
```

3. **Redeploy contracts** and test

#### Step 3: Testing Achievements

```bash
# Test achievement unlocking
pnpm test

# Check specific scenarios:
# - User's first contribution unlocks "First Word"
# - User's first story creation unlocks "Story Starter"
# - Story completion in <24h unlocks "Speed Demon"
```

### Customizing Achievement Display

Edit `src/components/achievement-badges.tsx`:

```typescript
// Change grid layout (currently 3 columns on large screens)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Modify unlock animation
className={`... ${
  achievement.unlocked
    ? 'hover:scale-105' // Add more animations here
    : 'opacity-60'
}`}
```

---

## 3. Social Sharing Features

### Overview
Users can share completed stories on Twitter and Farcaster, with automatic share count tracking.

### Files Involved
- `src/components/social-share.tsx` - Social sharing component
- `contracts/StoryManager.sol` - Share count tracking

### Supported Platforms

1. **Twitter** - Opens Twitter with pre-filled tweet
2. **Farcaster** - Opens Warpcast with pre-filled cast
3. **Copy Link** - Copies story URL to clipboard

### How It Works

1. User clicks share button for completed story
2. Opens platform's share dialog with pre-filled content
3. Contract tracks share count via `shareStory()` function

### Contract Function

```solidity
// Track story shares
function shareStory(string memory storyId) external
```

### Step-by-Step Implementation

#### Step 1: Adding Social Share to Stories

```typescript
import { SocialShare } from '@/components/social-share';

// In completed story view
<SocialShare 
  story={completedStory}
  onShare={async () => {
    // Call contract to track share
    await writeContract({
      address: STORY_MANAGER_ADDRESS,
      abi: StoryManagerABI,
      functionName: 'shareStory',
      args: [story.storyId]
    });
  }}
/>
```

#### Step 2: Customizing Share Text

Edit `src/components/social-share.tsx`:

```typescript
// Customize share message
const shareText = `Check out this hilarious Ghost Writer story: "${story.title}" 👻✨`;

// Add custom parameters
const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=GhostWriter,NFT,Base`;
```

#### Step 3: Adding Share Buttons

To add social sharing to story cards:

```typescript
// In src/components/story-card.tsx (for completed stories)
{story.status === 'complete' && (
  <SocialShare story={story} onShare={handleShare} />
)}
```

### Tracking Share Analytics

Query share counts from the contract:

```solidity
// Get story share count
story.shareCount

// Get user's total shares
userStats[user].shareCount
```

---

## 4. Story Categories & Themes

### Overview
Stories are organized into 9 thematic categories to help users discover content they enjoy.

### Available Categories

| Category | Emoji | Description |
|----------|-------|-------------|
| **Fantasy** | 🧙 | Magical worlds and mythical creatures |
| **Sci-Fi** | 🚀 | Futuristic technology and space adventures |
| **Comedy** | 😂 | Hilarious and absurd scenarios |
| **Horror** | 👻 | Spooky and frightening tales |
| **Adventure** | 🗺️ | Exciting journeys and quests |
| **Mystery** | 🔍 | Puzzles and unsolved cases |
| **Romance** | 💕 | Love stories and relationships |
| **Crypto** | ₿ | Blockchain and web3 themed |
| **Random** | 🎲 | Anything goes! |

### Files Involved
- `contracts/StoryManager.sol` - Category tracking
- `src/types/ghostwriter.ts` - Category definitions
- `src/components/story-creation-modal.tsx` - Category selector

### How Categories Work

1. **Story Creation**: Creator selects category when creating story
2. **Filtering**: Users can filter stories by category
3. **Discovery**: Browse all stories in a specific category

### Contract Functions

```solidity
// Get stories by category
function getStoriesByCategory(StoryCategory category) 
    external view returns (string[] memory)
```

### Step-by-Step Implementation

#### Step 1: Creating Story with Category

```typescript
// In story creation flow
await writeContract({
  address: STORY_MANAGER_ADDRESS,
  abi: StoryManagerABI,
  functionName: 'createStory',
  args: [
    storyId,
    title,
    template,
    storyType,
    category, // Add category parameter
    wordTypes
  ],
  value: CREATION_FEE
});
```

#### Step 2: Filtering by Category

```typescript
import { CATEGORY_INFO } from '@/types/ghostwriter';

// Category filter component
const [selectedCategory, setSelectedCategory] = useState<StoryCategory>('all');

// Fetch stories by category
const storiesByCategory = await readContract({
  address: STORY_MANAGER_ADDRESS,
  abi: StoryManagerABI,
  functionName: 'getStoriesByCategory',
  args: [selectedCategory as number] // Convert to enum value
});
```

#### Step 3: Adding Category Filter UI

```typescript
// Category filter buttons
<div className="flex gap-2 flex-wrap">
  {Object.entries(CATEGORY_INFO).map(([key, info]) => (
    <Button
      key={key}
      variant={selectedCategory === key ? 'default' : 'outline'}
      onClick={() => setSelectedCategory(key as StoryCategory)}
      className="gap-2"
    >
      <span>{info.emoji}</span>
      <span>{info.name}</span>
    </Button>
  ))}
</div>
```

#### Step 4: Adding New Categories

To add a new category:

1. **Update contract enum** (`contracts/StoryManager.sol`):

```solidity
enum StoryCategory {
    FANTASY,
    SCIFI,
    COMEDY,
    HORROR,
    ADVENTURE,
    MYSTERY,
    ROMANCE,
    CRYPTO,
    RANDOM,
    NEW_CATEGORY // Add here
}
```

2. **Update TypeScript types** (`src/types/ghostwriter.ts`):

```typescript
export type StoryCategory =
  | 'fantasy'
  | 'scifi'
  // ... existing categories ...
  | 'new_category'; // Add here

export const CATEGORY_INFO: Record<StoryCategory, { name: string; emoji: string; description: string }> = {
  // ... existing categories ...
  new_category: {
    name: 'New Category',
    emoji: '🎨',
    description: 'Description of new category',
  },
};
```

3. **Redeploy contracts**

---

## 5. Admin Dashboard

### Overview
The admin dashboard provides contract owners with tools to manage the platform, create stories, airdrop credits, and monitor analytics.

### Files Involved
- `src/components/admin-dashboard.tsx` - Dashboard UI
- `src/app/admin/page.tsx` - Admin page route
- `contracts/StoryManager.sol` - Admin functions

### Dashboard Features

#### 1. **Statistics Overview**
- Total users
- Active stories
- Total NFTs minted
- Liquidity pool balance

#### 2. **Story Management**
- Create new story templates
- View all stories
- Monitor story completion rates

#### 3. **User Management**
- Airdrop creation credits
- View user statistics
- Ban/unban users (if implemented)

#### 4. **Analytics**
- Category distribution
- Achievement statistics
- Recent activity feed

#### 5. **Emergency Controls**
- Emergency withdrawal
- Contract address display

### Step-by-Step Implementation

#### Step 1: Access Control

The dashboard automatically checks if the connected wallet is the contract owner:

```typescript
// In admin-dashboard.tsx
const isAdmin = address === CONTRACT_OWNER_ADDRESS;

if (!isAdmin) {
  return <AccessDeniedMessage />;
}
```

To set the owner address:

```bash
# In .env
NEXT_PUBLIC_ADMIN_ADDRESS=0xYourOwnerAddress
```

#### Step 2: Creating Stories as Admin

Admin can bootstrap initial stories:

```typescript
// Create story without requiring credits (admin only)
const handleAdminCreateStory = async () => {
  // First give yourself credit
  await writeContract({
    address: STORY_MANAGER_ADDRESS,
    abi: StoryManagerABI,
    functionName: 'airdropCredits', // If implemented
    args: [[ownerAddress], 1]
  });
  
  // Then create story normally
  await createStory(...);
};
```

#### Step 3: Airdropping Credits

To bootstrap the platform, airdrop credits to early users:

1. **Add airdrop function to contract** (`contracts/StoryManager.sol`):

```solidity
/**
 * @dev Owner can airdrop creation credits (bootstrap only)
 */
function airdropCredits(address[] memory users, uint256 amount) 
    external onlyOwner {
    for (uint i = 0; i < users.length; i++) {
        userStats[users[i]].creationCredits += amount;
        emit CreationCreditEarned(users[i], userStats[users[i]].creationCredits);
    }
}
```

2. **Call from admin dashboard**:

```typescript
const addresses = ['0x123...', '0x456...', '0x789...'];
const creditsPerUser = 5;

await writeContract({
  address: STORY_MANAGER_ADDRESS,
  abi: StoryManagerABI,
  functionName: 'airdropCredits',
  args: [addresses, creditsPerUser]
});
```

#### Step 4: Accessing the Dashboard

Navigate to `/admin` in your app. Only the contract owner will see the full dashboard.

#### Step 5: Monitoring Analytics

The dashboard displays real-time analytics. To customize:

```typescript
// Fetch platform stats
const totalUsers = await readContract({
  functionName: 'getTotalUsers' // If implemented
});

const totalStories = await readContract({
  functionName: 'getTotalStories'
});

// Display in dashboard
<StatsCard title="Total Users" value={totalUsers} trend="+12% this week" />
```

### Admin Functions Reference

```solidity
// Airdrop credits (if added)
function airdropCredits(address[] memory users, uint256 amount) external onlyOwner

// Emergency withdrawal
function emergencyWithdraw() external onlyOwner

// Update base URIs for NFTs
function updateBaseURIs(string memory hiddenURI, string memory revealedURI) external onlyOwner
```

---

## 6. Testing Expansion Features

### Comprehensive Test Suite

Run all tests to verify expansion features:

```bash
# Run all contract tests
pnpm test

# Run with gas reporting
pnpm test:gas

# Run specific test file
pnpm hardhat test test/StoryManager.test.ts
```

### Manual Testing Checklist

#### Leaderboard
- [ ] User appears on leaderboard after first contribution
- [ ] Rank updates correctly after additional contributions
- [ ] Top 1000 limit is enforced
- [ ] Pagination works correctly
- [ ] User's own rank displays highlighted

#### Achievements
- [ ] "First Word" unlocks on first contribution
- [ ] "Story Starter" unlocks on first story creation
- [ ] "Prolific Writer" unlocks at 50 contributions
- [ ] "Night Owl" unlocks for 12am-6am contributions
- [ ] "Completion King" unlocks after 5 final words
- [ ] "Speed Demon" unlocks for <24h completions

#### Social Sharing
- [ ] Twitter share opens with correct pre-filled text
- [ ] Farcaster share opens in Warpcast
- [ ] Copy link works and shows success toast
- [ ] Share count increments on contract
- [ ] Share count displays correctly in UI

#### Story Categories
- [ ] All 9 categories display correctly
- [ ] Stories can be created with category
- [ ] Category filter works
- [ ] Stories appear in correct category
- [ ] Category emoji displays properly

#### Admin Dashboard
- [ ] Only owner can access dashboard
- [ ] Non-owners see access denied message
- [ ] Story creation works for admin
- [ ] Credit airdrop works (if implemented)
- [ ] Analytics display correctly
- [ ] Emergency withdrawal works (CAUTION: test on testnet only!)

---

## 7. Common Issues & Troubleshooting

### Issue: Leaderboard Not Updating

**Symptom**: User's rank doesn't change after contributing

**Solutions**:
1. Check contract is deployed with leaderboard features:
   ```bash
   pnpm deploy:baseSepolia
   ```

2. Verify contract address in `.env`:
   ```env
   NEXT_PUBLIC_STORY_MANAGER_ADDRESS=0x...
   ```

3. Check transaction was successful:
   ```bash
   # View on block explorer
   # Base Sepolia: https://sepolia.basescan.org
   ```

4. Reload leaderboard data:
   ```typescript
   await refetchLeaderboard();
   ```

### Issue: Achievements Not Unlocking

**Symptom**: Achievement criteria met but badge not showing

**Solutions**:
1. Check achievement logic in contract:
   ```solidity
   // Verify criteria is correct
   if (userStats[msg.sender].contributionsCount == 50) {
       _unlockAchievement(...);
   }
   ```

2. Query achievements from contract:
   ```typescript
   const achievements = await readContract({
     functionName: 'getUserAchievements',
     args: [address]
   });
   console.log('User achievements:', achievements);
   ```

3. Verify transaction included achievement unlock event:
   ```typescript
   // Check event logs
   const receipt = await waitForTransaction({ hash: txHash });
   console.log('Events:', receipt.logs);
   ```

### Issue: Social Sharing Not Tracking

**Symptom**: Share count doesn't increment

**Solutions**:
1. Ensure `shareStory()` function is called:
   ```typescript
   await writeContract({
     functionName: 'shareStory',
     args: [storyId]
   });
   ```

2. Check story is completed:
   ```solidity
   require(story.status == StoryStatus.COMPLETE, "Can only share completed stories");
   ```

3. Verify wallet is connected

### Issue: Admin Dashboard Access Denied

**Symptom**: Contract owner sees "Access Denied"

**Solutions**:
1. Verify owner address matches:
   ```typescript
   const owner = await readContract({
     address: STORY_MANAGER_ADDRESS,
     functionName: 'owner'
   });
   console.log('Contract owner:', owner);
   console.log('Connected address:', address);
   ```

2. Ensure wallet is connected to correct network

3. Check contract ownership:
   ```bash
   # On block explorer, verify the owner() function returns your address
   ```

### Issue: Categories Not Displaying

**Symptom**: Category filter shows no results

**Solutions**:
1. Verify category is set when creating story
2. Check contract category mappings:
   ```solidity
   storiesByCategory[category].push(storyId);
   ```

3. Query specific category:
   ```typescript
   const stories = await readContract({
     functionName: 'getStoriesByCategory',
     args: [0] // 0 = FANTASY
   });
   ```

### Getting Help

If you encounter issues not covered here:

1. **Check Contract Events**: View transaction logs on Base scan
2. **Review Test Output**: Run `pnpm test` for detailed errors
3. **Console Logging**: Add `console.log()` statements in components
4. **Network Issues**: Verify you're on the correct network (Base Sepolia or Base Mainnet)

---

## 🎉 Next Steps

Once all expansion features are implemented and tested:

1. ✅ Deploy to Base Mainnet: `pnpm deploy:base`
2. ✅ Update production `.env` with mainnet addresses
3. ✅ Test all features on mainnet with small amounts
4. ✅ Create initial stories and airdrop credits to early users
5. ✅ Launch marketing campaign highlighting new features
6. ✅ Monitor leaderboard and achievement unlocks
7. ✅ Gather user feedback and iterate

---

## 📚 Additional Resources

- [Base Documentation](https://docs.base.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Wagmi Documentation](https://wagmi.sh)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ghost Writer Main README](./README.md)

---

**Built with ❤️ for the Ghost Writer community on Base**
