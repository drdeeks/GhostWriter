# 🎨 Ghost Writer NFT System

This document outlines the NFT system for Ghost Writer, including data display mechanisms, image styling guidelines, and IPFS setup instructions.

## 📊 NFT Data Structure

### Contract Data Fields

Each NFT contains the following metadata stored on-chain:

```solidity
struct NFTData {
    string storyId;              // Unique story identifier
    string storyTitle;           // Human-readable story title
    uint256 wordPosition;        // Position in story (1-indexed)
    uint256 totalWords;          // Total words needed for story
    string wordType;             // Type of word (adjective, noun, verb, etc.)
    string contributedWord;      // The actual word contributed (revealed only)
    address contributor;         // Contributor's wallet address
    uint256 contributionTimestamp; // When contribution was made
    bool storyComplete;          // Whether story is finished
    bool revealed;               // Whether NFT is in revealed state
}
```

### Display States

#### 🔒 Hidden State (Before Story Completion)
- **URI**: `{HIDDEN_BASE_URI}/{tokenId}`
- **Shows**: Position, word type, story title
- **Hides**: The actual contributed word
- **Purpose**: Maintain suspense and prevent copying

#### ✨ Revealed State (After Story Completion)
- **URI**: `{REVEALED_BASE_URI}/{tokenId}`
- **Shows**: Complete story context with contributed word
- **Purpose**: Display final story and contributor's role

## 🎨 Image Template Guidelines

### Design Philosophy

Ghost Writer NFTs should embody mystery and storytelling with a clean, professional aesthetic that works across different story themes.

### Hidden State Template

#### Layout Structure
```
┌─────────────────────────────────────┐
│           GHOST WRITER              │  ← Header
├─────────────────────────────────────┤
│                                     │
│        [Story Title]                │  ← Centered, prominent
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Position: [X]/[Y]              │  ← e.g., "Position: 3/10"
│                                     │
│      Word Type: [TYPE]              │  ← e.g., "Word Type: Adjective"
│                                     │
├─────────────────────────────────────┤
│                                     │
│         [Mysterious Icon]           │  ← Ghost, quill, book, etc.
│                                     │
│      "Your word awaits reveal..."   │
│                                     │
└─────────────────────────────────────┘
```

#### Styling Requirements

**Color Scheme:**
- **Primary**: Deep purple/midnight blue (#2D1B69, #1A1A2A)
- **Accent**: Gold/amber for highlights (#D4AF37, #F59E0B)
- **Text**: White/light gray (#FFFFFF, #F3F4F6)
- **Background**: Dark gradient or subtle pattern

**Typography:**
- **Headers**: Bold, serif font (Playfair Display, Crimson Text)
- **Body**: Clean sans-serif (Inter, Roboto)
- **Position/Type**: Monospace for consistency (JetBrains Mono)

**Visual Elements:**
- **Icons**: Ghost silhouette, antique quill, ancient book
- **Effects**: Subtle glow effects, parchment texture
- **Resolution**: 1024x1024px minimum
- **Format**: PNG with transparency support

### Revealed State Template

#### Layout Structure
```
┌─────────────────────────────────────┐
│           GHOST WRITER              │
├─────────────────────────────────────┤
│        [Story Title]                │
├─────────────────────────────────────┤
│                                     │
│   "In a [ADJ] [NOUN], the [VERB]    │
│    [WORD] and created chaos..."     │  ← Story snippet with highlighted word
│                                     │
├─────────────────────────────────────┤
│   Your Contribution:                │
│   Position [X]: "[WORD]"            │  ← Highlighted contribution
│                                     │
│   Word Type: [TYPE]                 │
│   Contributed: [DATE]               │
│                                     │
└─────────────────────────────────────┘
```

#### Styling Requirements

**Color Scheme:**
- **Primary**: Same as hidden state
- **Highlight**: Bright accent color for contributed word (#10B981, #3B82F6)
- **Success**: Green tones for completion (#059669)

**Typography:**
- **Story Text**: Readable serif for narrative flow
- **Contribution**: Bold highlighting for user's word
- **Metadata**: Smaller, subtle text

**Visual Elements:**
- **Highlighting**: Underline, background color, or glow effect on contributed word
- **Story Context**: 2-3 sentences showing word usage
- **Achievement Badge**: "Story Complete" indicator
- **Contributor Credit**: Clear attribution

## 🖼️ Dynamic Image Generation

### Template Variables

Hidden State Metadata:
```json
{
  "storyId": "story_001",
  "storyTitle": "The Haunted Library",
  "wordPosition": 3,
  "totalWords": 10,
  "wordType": "adjective",
  "contributor": "0x1234...",
  "timestamp": 1640995200
}
```

Revealed State Metadata:
```json
{
  "storyId": "story_001",
  "storyTitle": "The Haunted Library",
  "wordPosition": 3,
  "totalWords": 10,
  "wordType": "adjective",
  "contributedWord": "mysterious",
  "contributor": "0x1234...",
  "timestamp": 1640995200,
  "storySnippet": "In a mysterious library, the ancient books whispered secrets..."
}
```

### Generation Workflow

1. **API Endpoint**: Receives token metadata
2. **Template Selection**: Hidden vs Revealed
3. **Dynamic Rendering**: SVG/HTML to PNG conversion
4. **IPFS Upload**: Generated image to IPFS
5. **Metadata Update**: Store IPFS hash

## 🌐 IPFS Setup Guide

### Prerequisites

- IPFS node or pinning service account
- Image generation service (Node.js, Python, etc.)
- Environment variables configured

### Step 1: Choose IPFS Solution

#### Option A: Self-Hosted IPFS Node
```bash
# Install IPFS
npm install -g ipfs

# Initialize and start
ipfs init
ipfs daemon

# Configure CORS for web access
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
```

#### Option B: Pinning Services (Recommended)
- **Pinata**: https://pinata.cloud
- **NFT.Storage**: https://nft.storage
- **Web3.Storage**: https://web3.storage
- **Infura**: https://infura.io

### Step 2: Directory Structure

```
ipfs/
├── hidden/           # Hidden state images
│   ├── 1.png
│   ├── 2.png
│   └── ...
├── revealed/         # Revealed state images
│   ├── 1.png
│   ├── 2.png
│   └── ...
└── metadata/         # JSON metadata files
    ├── 1.json
    ├── 2.json
    └── ...
```

### Step 3: Metadata Format

#### Hidden State Metadata (`metadata/1.json`)
```json
{
  "name": "Ghost Writer #1",
  "description": "A mysterious word contribution to 'The Haunted Library'. Position 3/10 - Adjective. The story awaits completion...",
  "image": "ipfs://QmHiddenBaseURI/1.png",
  "attributes": [
    {
      "trait_type": "Story",
      "value": "The Haunted Library"
    },
    {
      "trait_type": "Position",
      "value": "3/10"
    },
    {
      "trait_type": "Word Type",
      "value": "Adjective"
    },
    {
      "trait_type": "Status",
      "value": "Hidden"
    },
    {
      "trait_type": "Contribution Date",
      "value": "2024-01-01"
    }
  ]
}
```

#### Revealed State Metadata (`metadata/1.json`)
```json
{
  "name": "Ghost Writer #1",
  "description": "Word contribution revealed! In a mysterious library, the ancient books whispered secrets and created wonder...",
  "image": "ipfs://QmRevealedBaseURI/1.png",
  "attributes": [
    {
      "trait_type": "Story",
      "value": "The Haunted Library"
    },
    {
      "trait_type": "Position",
      "value": "3/10"
    },
    {
      "trait_type": "Word Type",
      "value": "Adjective"
    },
    {
      "trait_type": "Contributed Word",
      "value": "mysterious"
    },
    {
      "trait_type": "Status",
      "value": "Revealed"
    },
    {
      "trait_type": "Contribution Date",
      "value": "2024-01-01"
    }
  ]
}
```

### Step 4: Environment Configuration

```env
# IPFS Configuration
IPFS_API_ENDPOINT=https://api.pinata.cloud
IPFS_API_KEY=your_pinata_api_key
IPFS_SECRET_KEY=your_pinata_secret

# NFT Base URIs
NEXT_PUBLIC_HIDDEN_BASE_URI=ipfs://QmYourHiddenBaseURI/
NEXT_PUBLIC_REVEALED_BASE_URI=ipfs://QmYourRevealedBaseURI/
```

### Step 5: Upload Process

#### Using Pinata API
```javascript
const axios = require('axios');
const FormData = require('form-data');

async function uploadToIPFS(filePath, fileName) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${process.env.IPFS_API_KEY}`,
        ...formData.getHeaders()
      }
    }
  );

  return response.data.IpfsHash;
}
```

#### Using NFT.Storage
```javascript
import { NFTStorage, File } from 'nft.storage';

const client = new NFTStorage({ token: process.env.NFT_STORAGE_TOKEN });

async function uploadImage(imageFile) {
  const cid = await client.storeBlob(new File([imageFile], 'image.png'));
  return cid;
}
```

### Step 6: Base URI Setup

After uploading, update your contract:

```javascript
// Update base URIs in contract
await nftContract.updateBaseURIs(
  "ipfs://QmYourHiddenBaseURI/",
  "ipfs://QmYourRevealedBaseURI/"
);
```

### Step 7: Testing

1. **Mint Test NFT**: Deploy locally and mint a test NFT
2. **Check Hidden State**: Verify correct hidden image displays
3. **Complete Story**: Trigger story completion
4. **Check Revealed State**: Verify revealed image with word shows
5. **Metadata Validation**: Ensure all attributes display correctly

## 🔧 Technical Implementation

### Image Generation Service

Example Node.js service using Canvas API:

```javascript
const { createCanvas } = require('canvas');
const fs = require('fs');

function generateHiddenImage(metadata) {
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
  gradient.addColorStop(0, '#2D1B69');
  gradient.addColorStop(1, '#1A1A2A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px Playfair Display';
  ctx.textAlign = 'center';
  ctx.fillText('GHOST WRITER', 512, 100);

  // Story title
  ctx.font = '36px Playfair Display';
  ctx.fillText(metadata.storyTitle, 512, 200);

  // Position info
  ctx.font = '24px Inter';
  ctx.fillText(`Position: ${metadata.wordPosition}/${metadata.totalWords}`, 512, 350);
  ctx.fillText(`Word Type: ${metadata.wordType}`, 512, 400);

  // Mystery text
  ctx.fillStyle = '#F59E0B';
  ctx.font = 'italic 28px Crimson Text';
  ctx.fillText('"Your word awaits reveal..."', 512, 600);

  return canvas.toBuffer('image/png');
}
```

### Automation Workflow

1. **Contribution Event**: Listen for `NFTMinted` events
2. **Generate Hidden Image**: Create and upload to IPFS
3. **Store Metadata**: Upload JSON metadata
4. **Story Completion**: Listen for `StoryCompleted` events
5. **Generate Revealed Image**: Include story context and word
6. **Update Metadata**: Replace hidden with revealed metadata

## 📋 Quality Assurance

### Image Requirements
- [ ] 1024x1024px minimum resolution
- [ ] PNG format with transparency
- [ ] Consistent color scheme across states
- [ ] Readable text at all sizes
- [ ] Optimized file size (< 1MB)

### Metadata Requirements
- [ ] Valid JSON format
- [ ] All required attributes present
- [ ] IPFS URLs accessible
- [ ] Unique token names
- [ ] Descriptive attributes

### IPFS Requirements
- [ ] Files pinned (not just cached)
- [ ] Accessible via public gateway
- [ ] Backup pinning services configured
- [ ] Content verification hashes match

## 🚀 Deployment Checklist

- [ ] IPFS service configured and tested
- [ ] Image generation service deployed
- [ ] Base URIs set in contract
- [ ] Environment variables configured
- [ ] Test NFTs minted and verified
- [ ] Hidden/revealed states working
- [ ] Metadata displaying correctly in wallets
- [ ] Backup systems in place

---

**Built for the future of storytelling on Web3** 🖼️📚✨
