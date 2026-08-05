# Creation Flow, Roast Mode & NFT Rework — ENTERPRISE BLUEPRINT
## Version: 1.0 | Document Class: MASTER SPECIFICATION
## Scope: PROJECT
### Generated: 2026-08-05

> **READ FIRST — DOCUMENT AUTHORITY**
> This document is the single source of truth. No feature may be built,
> no contract redeployed, and no API changed without this document as the
> authoritative reference. All contributors MUST read Part V (Change
> Control Protocol) before touching any file. This document's change
> log is APPEND-ONLY. Prior sections may only be updated via a formal
> amendment with a corresponding CL entry.

---

## TABLE OF CONTENTS

```
PART I    — SYSTEM OVERVIEW & ARCHITECTURE
PART II   — MODULE REGISTRY
PART III  — SCREEN & FEATURE SPECIFICATIONS
PART IV   — DATA ARCHITECTURE
PART V    — CHANGE CONTROL PROTOCOL
PART VI   — MASTER IMPLEMENTATION CHECKLIST
PART VII  — QUALITY & COMPLIANCE STANDARDS
```

---

---

# PART I — SYSTEM OVERVIEW & ARCHITECTURE

> **Rollback Tag:** `[SYS-OVERVIEW-v1]`

## 1.1 Vision Statement

GhostWriter's creation flow currently lets a creator see and pick from full
mad-libs templates, and its NFTs mint on story completion with no
personality. This project reworks both: creation becomes a two-step
category → title-teaser choice (with an always-available "??" wildcard that
roasts the selecting user using their real Farcaster data when running in
the Farcaster miniapp), the creator's NFT mints immediately with their
optional first word baked in, and contributor NFTs get a deliberate
hidden/revealed visual identity designed for reuse in a future
NFT-combination project. An admin-only unlimited-length creation path is
added for one "genesis story" to reward early supporters. This is a solo
hobby project — technically complete, not enterprise-scaled for load that
will never arrive.

## 1.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              ENTRY LAYER                                  │
│                                                                            │
│  Landing (/)  ──connect wallet──▶  App (/app)  ──owner only──▶  Admin    │
│                                        │                          (/admin)│
│                          Farcaster miniapp context (FID, if present)      │
│                          detected via FarcasterWrapper + miniapp-sdk      │
└───────────────────────────────────┬──────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                           APPLICATION LAYER                               │
│                                                                            │
│  ┌─────────────────────┐   ┌──────────────────────┐  ┌─────────────────┐ │
│  │ Story Creation Modal │──▶│ POST /api/generate-  │─▶│  AIService       │ │
│  │ (category picker,    │   │ story                 │  │  (multi-provider │ │
│  │  5 suggestions + ??) │   │ (EIP-712 signs the    │  │  failover:       │ │
│  └─────────┬────────────┘   │  approved creation)   │  │  OpenAI/         │ │
│            │                 └──────────────────────┘  │  OpenRouter/     │ │
│            │ "??" in Farcaster                          │  Mistral/        │ │
│            ▼                                            │  Workers AI)     │ │
│  ┌─────────────────────┐   ┌──────────────────────┐    └────────┬────────┘ │
│  │ NeynarService (NEW)  │──▶│ GET api.neynar.com/  │             │          │
│  │ fetch profile/stats/ │   │ v2/farcaster/user...  │             │          │
│  │ posts by FID          │   └──────────────────────┘             │          │
│  └───────────────────────┘                                        │          │
│                                                                    ▼          │
│  ┌────────────────────────┐   ┌────────────────────────┐  Roast/teaser     │
│  │ /api/nft/[tokenId]      │   │ /api/nft/[tokenId]/    │  prompt built     │
│  │ (metadata: hidden vs    │   │ image                   │  from real        │
│  │  revealed JSON)         │   │ (hidden vs revealed PNG/│  Neynar data      │
│  │                         │   │  SVG render)            │                    │
│  └────────────────────────┘   └────────────────────────┘                   │
└───────────────────────────────────┬──────────────────────────────────────┘
                                     │  wagmi useWriteContract / useReadContract,
                                     │  routed per active chain via
                                     │  getContractsForChain(useChainId())
┌────────────────────────────────────▼─────────────────────────────────────┐
│                       CHAIN ROUTING LAYER (existing, this session)        │
│                                                                            │
│  ChainSwitcher (src/components/ChainSwitcher.tsx)                        │
│   - reads/sets active chain via useChainId() / useSwitchChain()          │
│  contracts.ts: CONTRACTS_BY_CHAIN[chainId] → per-chain addresses         │
│   - Base (8453): live today                                              │
│   - Monad (143): addresses all-zero until deployed (Phase 6 of this doc) │
└───────────────────────────────────┬──────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                          ON-CHAIN DATA LAYER (Base + Monad)                │
│                                                                            │
│  StoryManager.sol                     GhostWriterNFT.sol                  │
│   - createStoryApproved(..., firstWord?)  - mintCreatorNFT (now called    │
│     optional atomic first word              from createStoryApproved,     │
│   - createGenesisStory (NEW, onlyOwner,     not finalizeStory)            │
│     unlimited slot count)                 - mintHiddenNFT (contributors)  │
│   - existing: contributeWord, finalize-   - tokenURI routes to Next.js    │
│     Story, withdrawRefund, admin fns        metadata/image API above      │
│                                                                            │
│  Fee model (unchanged by this project):                                  │
│   - getContributionFee()/getCreationFee() → PriceOracle.usdToEth()       │
│   - $0.05 contribution / $0.10 creation, computed live in ETH             │
└──────────────────────────────────────────────────────────────────────────┘
```

**Diagram legend:** `──▶` = data/control flow, `│`/`▼` = layer boundary,
boxes = deployed components. The Chain Routing Layer was built earlier this
session (multi-chain wiring) and is included here because Phase 6 of this
project's rollout redeploys onto it — this project's contract changes ship
to both Base and, once deployed, Monad through the same routing.

## 1.3 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Contracts | Solidity 0.8.28, Hardhat 2, OpenZeppelin (Ownable/ReentrancyGuard) | Already in place; changes are additive to StoryManager/GhostWriterNFT, not a rewrite |
| Frontend | Next.js 16 (App Router), React 19, wagmi 2 + viem, Tailwind v4 | Already in place; this project extends existing hooks/components |
| Hosting | Cloudflare Workers (`@opennextjs/cloudflare`) | Already deployed this session; AI roast prompt path can optionally use the Workers AI binding already wired |
| AI | OpenAI/OpenRouter/Mistral/Cloudflare Workers AI (failover chain, already built) | Reused as-is for both title-teaser generation and roast-mode generation — new prompt paths, same provider chain |
| Identity | Farcaster miniapp-sdk (existing) + Neynar API (NEW) | miniapp-sdk gives us the FID; Neynar gives us the profile/stats/posts data to roast with |
| "Database" | None (on-chain contract storage + NFT metadata JSON) | This project has no SQL layer — Part IV below documents the actual persisted state instead of forcing an unused DB pattern |

---

---

# PART II — MODULE REGISTRY

> **Rollback Tag:** `[MODULE-REGISTRY-v1]`
> **Rule:** Every change log entry MUST reference at least one Module ID
> (unless this Part is N/A for this scope).

| Module ID | Name | Description | Feature Flag |
|---|---|---|---|
| MOD-001 | Contract Layer | StoryManager/GhostWriterNFT changes: genesis-story admin path, optional atomic first-word, immediate creator-NFT mint | `FEAT_CONTRACT_V2` |
| MOD-002 | Neynar Identity Service | New service module fetching a Farcaster user's profile/stats/posts by FID for roast-mode grounding | `FEAT_NEYNAR_IDENTITY` |
| MOD-003 | Creation Flow UI | Category picker → 5 title+teaser suggestions + always-visible "??" wildcard, replacing the current full-template flow | `FEAT_CREATION_FLOW_V2` |
| MOD-004 | Roast/Wildcard Generation | New AI prompt path in ai-service.ts: Farcaster-aware roast story (Neynar-grounded) or category-random surprise story (non-Farcaster fallback) | `FEAT_ROAST_MODE` |
| MOD-005 | NFT Metadata & Image Rendering | Rewrite of `/api/nft/[tokenId]` (metadata) and `/api/nft/[tokenId]/image` (visual) for the new hidden/revealed spec | `FEAT_NFT_REWORK` |

---

---

# PART III — SCREEN & FEATURE SPECIFICATIONS

> **Rollback Tag:** `[SPECS-v1]`

Each specification follows: ID, Module Ref, Rollback Tag, Feature Flag,
Purpose, Components, Rules, Error States, Fallback.

### SPEC-001 — Genesis Story (Admin Unlimited-Length Creation)
- **Feature ID:** SPEC-001
- **Module Ref:** MOD-001
- **Rollback Tag:** `[SPEC-001-v1]`
- **Feature Flag:** `FEAT_CONTRACT_V2`
- **Purpose:** Let the contract owner create exactly one "genesis" story with a slot count beyond Epic's 25-slot cap, to reward early supporters with more contribution/credit-earning opportunities.
- **Components:** New `createGenesisStory(...)` function on StoryManager, `onlyOwner`-gated, taking an explicit `totalSlots` param with no upper bound check (still `> 0`); admin dashboard UI to invoke it (Settings tab).
- **Rules:** Only callable by `owner()`. Does not replace `createStoryApproved` — Mini/Normal/Epic tiers keep their existing min/max enforcement unchanged, open to all users.
- **Error States:** Reverts if caller isn't owner; reverts if `totalSlots == 0`; reverts if the 15-active-stories cap is already hit (same cap applies).
- **Fallback:** None needed — this is an explicit admin action, not a user-facing path.

### SPEC-002 — Optional Atomic First-Word on Creation
- **Feature ID:** SPEC-002
- **Module Ref:** MOD-001
- **Rollback Tag:** `[SPEC-002-v1]`
- **Feature Flag:** `FEAT_CONTRACT_V2`
- **Purpose:** Let a creator optionally fill slot 1 in the same transaction as story creation, guaranteeing their word without a second contribution-fee payment or race against other contributors.
- **Components:** `createStoryApproved` gains an optional `firstWord` param (empty string = skip); if non-empty, the function internally performs the same slot-fill + hidden-NFT-mint logic as `contributeWord` would for position 1, using the creator's already-paid creation fee (no additional fee charged for this specific word).
- **Rules:** Word still goes through the same word-type validation as a normal contribution. Optional — frontend must not force a word to be entered to proceed with creation.
- **Error States:** If `firstWord` is provided but fails word-type/moderation validation, the whole creation transaction reverts (fail closed, not silently skip the word).
- **Fallback:** Omitting `firstWord` behaves exactly like today's `createStoryApproved` — slot 1 remains open for the first contributor.

### SPEC-003 — Immediate Creator NFT Mint
- **Feature ID:** SPEC-003
- **Module Ref:** MOD-001, MOD-005
- **Rollback Tag:** `[SPEC-003-v1]`
- **Feature Flag:** `FEAT_CONTRACT_V2`
- **Purpose:** Mint the creator's NFT at creation time instead of at story finalization, so the creator doesn't wait for other contributors to finish the story.
- **Components:** Move the `nftContract.mintCreatorNFT(...)` call from `finalizeStory`/completion logic into `createStoryApproved`/`createGenesisStory`. NFT data includes: creator wallet address, story title, category, creation timestamp (block.timestamp), and the first word if SPEC-002 was used.
- **Rules:** `finalizeStory` must no longer attempt to mint a second creator NFT — remove that call path entirely, don't leave dead/duplicate minting code.
- **Error States:** If NFT minting fails, the whole creation transaction reverts (NFT mint and story creation are one atomic unit, same as today's completion-time behavior — just moved earlier).
- **Fallback:** None — this is a hard behavior change, not optional.

### SPEC-004 — Category → 5 Title/Teaser Suggestions
- **Feature ID:** SPEC-004
- **Module Ref:** MOD-003
- **Rollback Tag:** `[SPEC-004-v1]`
- **Feature Flag:** `FEAT_CREATION_FLOW_V2`
- **Purpose:** Replace the current "see the whole template" flow with a title + short atmospheric teaser (2-3 sentences max, no placeholder/word-type content revealed) so users pick based on vibe, not spoilers.
- **Components:** `/api/generate-story` returns `{ title, teaser }[]` (5 items) instead of full templates; `AIService.generateStorySuggestions` gets a new prompt variant that explicitly asks for a hook/premise, not placeholder-filled content; story-creation-modal.tsx UI shows title + teaser cards, defers full template generation until a card is selected.
- **Rules:** Teaser must never contain `[WORD_TYPE]`-style placeholders — that's exactly what this feature is hiding.
- **Error States:** If AI generation fails for all providers (existing failover chain exhausted), fall back to the existing deterministic template generator, but derive a teaser from its title/category rather than showing the raw template.
- **Fallback:** Deterministic template generator (already exists) covers total AI outage.

### SPEC-005 — "??" Wildcard (Roast Mode / Surprise Mode)
- **Feature ID:** SPEC-005
- **Module Ref:** MOD-002, MOD-004
- **Rollback Tag:** `[SPEC-005-v1]`
- **Feature Flag:** `FEAT_ROAST_MODE`
- **Purpose:** A 6th, always-visible option alongside the 5 suggestions. In Farcaster, generates a factually-grounded roast of the selecting user using real Neynar profile data. Outside Farcaster, generates a random surprise story in the same category (no personal data, no roast).
- **Components:** `useFarcaster()` (existing) supplies `isMiniApp`/`farcasterUser.fid`; when true, `NeynarService.getUserProfile(fid)` (NEW) fetches profile/stats/casts; a new roast-prompt builder in ai-service.ts feeds that data into the chat-completion request; when `isMiniApp` is false, the existing category-based generation runs with a "surprise me" instruction instead of a roast instruction.
- **Rules:** Roast content still passes through the same moderation path as any other AI-generated content before being shown/used. Neynar API key absent = treat as "not in Farcaster" (fail to surprise-mode, not to an error).
- **Error States:** Neynar API failure → fall back to surprise mode (never block story creation on Neynar being down). AI generation failure → same failover chain as SPEC-004.
- **Fallback:** Non-Farcaster surprise mode; deterministic template generator as the final fallback.

### SPEC-006 — NFT Hidden State Rendering
- **Feature ID:** SPEC-006
- **Module Ref:** MOD-005
- **Rollback Tag:** `[SPEC-006-v1]`
- **Feature Flag:** `FEAT_NFT_REWORK`
- **Purpose:** Precise hidden-state visual for a contributor's not-yet-revealed NFT.
- **Components:** `/api/nft/[tokenId]/image` renders (centered, ~25% down from frame top): line 1 `[Story Title | ID: #storyId]`, line 2 the required word type (e.g. `[Verb]`), line 3 the literal text `"Unraveled"`. Story must be trackable by both title and a numeric ID (already exists on-chain; confirm the ID is exposed to the image route).
- **Rules:** No contributor word content is shown pre-reveal, only the word *type* required — nothing here should leak the actual word.
- **Error States:** Missing/unknown tokenId → existing 404/error handling, unchanged.
- **Fallback:** None needed — this is a pure rendering spec.

### SPEC-007 — NFT Revealed State Rendering
- **Feature ID:** SPEC-007
- **Module Ref:** MOD-005
- **Rollback Tag:** `[SPEC-007-v1]`
- **Feature Flag:** `FEAT_NFT_REWORK`
- **Purpose:** Post-completion reveal shows only the single sentence containing the contributor's word (word bolded) — not the whole story — for future composability with a separate NFT-combination project.
- **Components:** `/api/nft/[tokenId]` metadata now carries title/story ID/wallet address/Farcaster FID/etc. in the metadata JSON `attributes` (not rendered visually); `/api/nft/[tokenId]/image` extracts and renders just the sentence containing the contributor's placeholder position, with the word bolded.
- **Rules:** Sentence extraction must correctly identify sentence boundaries around the contributor's specific word position — this needs real sentence-splitting logic against the finalized story template, not a naive fixed-length slice.
- **Error States:** If sentence extraction fails (e.g. malformed template), fall back to showing the word alone with title/ID — never show nothing.
- **Fallback:** Word-only display as described above.

> **PROJECT tier requires 3+ feature specifications** — 7 provided above.

---

---

# PART IV — DATA ARCHITECTURE

> **Rollback Tag:** `[DATA-ARCH-v1]`
> **Adaptation note:** This project has no SQL database — all persisted
> state is either on-chain contract storage or NFT metadata JSON served
> dynamically by Next.js API routes. This section documents that state
> instead of forcing an unused SQL schema pattern.

## 4.1 On-Chain Storage Changes (StoryManager.sol / GhostWriterNFT.sol)

```solidity
// StoryManager.sol — new/changed state
mapping(string => uint256) public storyIdToNumericId;  // NEW: title+ID tracking
uint256 public nextStoryNumericId;                       // NEW: incrementing counter

// createStoryApproved signature change
function createStoryApproved(
    string calldata storyId,
    string calldata title,
    string calldata template,
    uint8 storyType,
    uint8 category,
    string[] calldata wordTypes,
    uint256 expiresAt,
    bytes calldata signature,
    string calldata firstWord        // NEW: empty string = skip (SPEC-002)
) external payable;

// NEW: admin-only unlimited-length creation (SPEC-001)
function createGenesisStory(
    string calldata storyId,
    string calldata title,
    string calldata template,
    uint256 totalSlots,
    uint8 category,
    string[] calldata wordTypes
) external payable onlyOwner;
```

```solidity
// GhostWriterNFT.sol — mintCreatorNFT call site moves from
// finalizeStory-path to createStoryApproved/createGenesisStory (SPEC-003).
// NFTData struct gains a `firstWordByCreator` field (may be empty).
```

> **PROJECT tier requires 3+ schemas** — 2 Solidity blocks + the metadata JSON schema in 4.2 below satisfy this in spirit; all three genuinely describe this project's real persisted data.

## 4.2 NFT Metadata JSON Schema (served by `/api/nft/[tokenId]`)

```json
{
  "name": "string",
  "description": "string (revealed sentence, or hidden placeholder text)",
  "image": "https://.../api/nft/{tokenId}/image",
  "attributes": [
    { "trait_type": "Story Title", "value": "string" },
    { "trait_type": "Story ID", "value": "number" },
    { "trait_type": "Wallet Address", "value": "0x..." },
    { "trait_type": "Farcaster FID", "value": "number | null" },
    { "trait_type": "Word Type", "value": "string" },
    { "trait_type": "Revealed", "value": "boolean" },
    { "trait_type": "Is Creator NFT", "value": "boolean" },
    { "trait_type": "Created At", "value": "ISO 8601 date" }
  ]
}
```

## 4.3 API Contract Specifications

> **Adaptation note:** Existing routes do NOT follow a `/api/v1/{resource}/{action}`
> REST convention (they predate this blueprint) — documenting real routes
> instead of forcing an unused pattern.

| Route | Method | Change |
|---|---|---|
| `/api/generate-story` | POST | Response shape changes from full templates to `{title, teaser}[]` (SPEC-004); new request param for "??" wildcard mode (SPEC-005) |
| `/api/neynar/profile` (NEW) | GET | `?fid=` → Neynar profile/stats/casts, server-side proxy so the Neynar API key never reaches the client (MOD-002) |
| `/api/nft/[tokenId]` | GET | Metadata schema changes per §4.2 (SPEC-007) |
| `/api/nft/[tokenId]/image` | GET | Hidden/revealed rendering rewrite (SPEC-006, SPEC-007) |

> **PROJECT tier requires 3+ documented endpoints** — 4 provided above.

---

---

# PART V — CHANGE CONTROL PROTOCOL

> **Rollback Tag:** `[CHANGE-CONTROL-v1]`
> **This section is permanent and non-negotiable.**

## Change Log Entry Format

```
Date        : YYYY-MM-DD HH:MM UTC
Contributor : [name/handle]
Modules     : [MOD-XXX, ...]
Section Tags: [[TAG-NAME-v1], ...]
Files Changed: [every file changed]
Description : [What changed and why — minimum 3 sentences]
Tests Passing: [test names, or 'none — pre-build']
Phase       : [PHASE-N]
Rollback Ref: [git commit hash]
```

## Contributor Rules (adapted for solo-dev + AI-assistant context)

1. No phase's work is considered done without a change log entry in the same commit.
2. No contract redeploy without the prior contract test suite passing locally first.
3. Feature flags are tracked in this document for traceability; this solo project does not need a runtime flag system — "flag" here means "documented capability gate," not a LaunchDarkly-style toggle.
4. Minimum: 1 Hardhat test per new/changed contract function, 1 route test per new/changed API endpoint.
5. No contributor (human or AI) may modify or delete an existing change log entry — only append.
6. Assigned Agent = whoever/whatever implements a phase (this session: Claude). Reviewer Agent = the project owner (drdeeks), who must actually look at the diff before a phase is marked complete — satisfies "reviewer differs from assignee" with a real human-in-the-loop review, not a second AI rubber-stamping the first.

---

---

# PART VI — MASTER IMPLEMENTATION CHECKLIST

### PHASE-0: Pre-Build

**Section Tag:** `[PHASE-0-v1]`
**Feature Flag:** `FEAT_PRE_BUILD`
**Assigned Agent:** claude (this session)
**Reviewer Agent:** drdeeks (project owner)

### Prerequisites

None — this is the first phase.

### Deliverables

- [ ] **PHASE-0.1** Type: approval — This blueprint reviewed and approved by drdeeks
- [ ] **PHASE-0.2** Type: external-check — Neynar API key acquired (https://neynar.com), added to `.env` as `NEYNAR_API_KEY`
- [ ] **PHASE-0.3** review-phase0.md Type: review

### Validation Gate

> No phase may begin until all prior checklist items are verified complete, all tests pass, and a change log entry is appended.

### Rollback Procedure

1. No code exists yet at this phase — rollback is simply "do not proceed."

---
### PHASE-1: Foundation (Contract Layer — MOD-001)

**Section Tag:** `[PHASE-1-v1]`
**Feature Flag:** `FEAT_CONTRACT_V2`
**Assigned Agent:** claude (this session)
**Reviewer Agent:** drdeeks (project owner)

### Prerequisites

Phase 0 complete.

### Deliverables

- [ ] **PHASE-1.1** Type: file — `contracts/StoryManager.sol`: `createGenesisStory` (SPEC-001), optional `firstWord` param on `createStoryApproved` (SPEC-002), `mintCreatorNFT` call moved to creation time (SPEC-003), story-title-to-numeric-ID tracking (§4.1)
- [ ] **PHASE-1.2** Type: file — `contracts/GhostWriterNFT.sol`: `NFTData` struct gains `firstWordByCreator`; `mintCreatorNFT` no longer called from the finalization path
- [ ] **PHASE-1.3** Type: file — `test-contracts/StoryManager.test.js`: tests for genesis-story creation (owner-only, unbounded slots), optional first-word (both provided and omitted), immediate creator-NFT mint (verify NFT exists right after `createStoryApproved`, not after finalization)
- [ ] **PHASE-1.4** Type: external-check — `npx hardhat test` passes locally, `npx hardhat compile` produces bytecode under the EIP-170 24576-byte limit (StoryManager was already at 24003/24576 before this phase — recheck after these additions)
- [ ] **PHASE-1.5** review-phase1.md Type: review

### Validation Gate

> Contract tests pass locally AND bytecode size is confirmed under the EIP-170 limit before this phase is marked complete — a redeploy on top of an oversized contract fails outright.

### Rollback Procedure

1. This phase only touches local contract source + tests, nothing deployed yet — rollback is a plain `git revert`.
2. If bytecode exceeds the size limit, reduce via the same technique used previously (drop non-essential revert strings, lower optimizer `runs`) rather than cutting a spec'd feature.

---
### PHASE-2: Authentication & Identity (Neynar Integration — MOD-002)

**Section Tag:** `[PHASE-2-v1]`
**Feature Flag:** `FEAT_NEYNAR_IDENTITY`
**Assigned Agent:** claude (this session)
**Reviewer Agent:** drdeeks (project owner)

### Prerequisites

Phase 0 complete (API key acquired). Does not depend on Phase 1.

### Deliverables

- [ ] **PHASE-2.1** Type: file — `src/lib/neynar-service.ts` (NEW): `getUserProfile(fid)` fetching profile, follower count, Neynar score, recent casts from Neynar's API, server-side only
- [ ] **PHASE-2.2** Type: file — `src/app/api/neynar/profile/route.ts` (NEW): thin server route proxying `neynar-service.ts` so `NEYNAR_API_KEY` never reaches the client
- [ ] **PHASE-2.3** Type: file — Env docs: `.env.example` gets `NEYNAR_API_KEY` documented (following this session's existing pattern for optional-provider keys)
- [ ] **PHASE-2.4** review-phase2.md Type: review

### Validation Gate

> Manually verified against a real FID (your own) returns real profile data before this phase is marked complete.

### Rollback Procedure

1. Disable by simply not setting `NEYNAR_API_KEY` — SPEC-005's fallback path (surprise mode) already handles the key being absent, so this phase is safe to roll back without touching Phase 3.

---
### PHASE-3: Core Feature Build (Creation Flow UI — MOD-003, MOD-004)

**Section Tag:** `[PHASE-3-v1]`
**Feature Flag:** `FEAT_CREATION_FLOW_V2`
**Assigned Agent:** claude (this session)
**Reviewer Agent:** drdeeks (project owner)

### Prerequisites

Phase 1 complete (contract supports optional first-word). Phase 2 complete (Neynar available for roast mode).

### Deliverables

- [ ] **PHASE-3.1** Type: file — `src/lib/ai-service.ts`: new prompt path for title+teaser generation (SPEC-004, replaces full-template generation for the suggestion step)
- [ ] **PHASE-3.2** Type: file — `src/lib/ai-service.ts`: new roast-prompt builder consuming Neynar profile data (SPEC-005), and a non-Farcaster "surprise" prompt variant
- [ ] **PHASE-3.3** Type: file — `src/app/api/generate-story/route.ts`: response shape change to `{title, teaser}[]`, new wildcard-mode request handling
- [ ] **PHASE-3.4** Type: file — `src/components/story/story-creation-modal.tsx`: category picker → 5 title/teaser cards + "??" card, optional first-word input wired to the Phase-1 contract param
- [ ] **PHASE-3.5** Type: file — `src/hooks/useContract.ts` or a new hook: wires the optional `firstWord` and `createGenesisStory` (admin-only, Settings tab) into `useStoryManager`
- [ ] **PHASE-3.6** review-phase3.md Type: review

### Validation Gate

> Full creation flow manually walked through end-to-end on a local/testnet deploy: category → 5 suggestions → select → optional word → create → verify creator NFT exists immediately. "??" tested both inside and outside a Farcaster context.

### Rollback Procedure

1. Feature-flag-equivalent: revert `story-creation-modal.tsx` to show the old flow while leaving the new contract functions unused but present (they're additive, not breaking, to the old flow).

---
### PHASE-4: Integration Layer (NFT Metadata & Image — MOD-005)

**Section Tag:** `[PHASE-4-v1]`
**Feature Flag:** `FEAT_NFT_REWORK`
**Assigned Agent:** claude (this session)
**Reviewer Agent:** drdeeks (project owner)

### Prerequisites

Phase 1 complete (contract exposes story numeric ID, word type, first word).

### Deliverables

- [ ] **PHASE-4.1** Type: file — `src/app/api/nft/[tokenId]/route.ts`: metadata schema per §4.2, hidden vs revealed branching
- [ ] **PHASE-4.2** Type: file — `src/app/api/nft/[tokenId]/image/route.ts`: hidden-state render (SPEC-006, exact layout spec), revealed-state single-sentence-with-bolded-word render (SPEC-007)
- [ ] **PHASE-4.3** Type: file — Sentence-extraction utility (new, likely `src/lib/`) that correctly locates the sentence containing a given word position in the finalized template — this is the one genuinely tricky piece of logic in this phase and deserves its own unit tests
- [ ] **PHASE-4.4** review-phase4.md Type: review

### Validation Gate

> Both hidden and revealed images verified visually (not just "the route returns 200") against a real minted NFT before this phase is marked complete.

### Rollback Procedure

1. Route-level revert to the prior image/metadata generation logic — these routes are independent of the contract changes in Phase 1, so rollback here doesn't require touching contracts.

---
### PHASE-5: Testing & Hardening

**Section Tag:** `[PHASE-5-v1]`
**Feature Flag:** `FEAT_TESTING_HARDENING`
**Assigned Agent:** claude (this session)
**Reviewer Agent:** drdeeks (project owner)

### Prerequisites

Phases 1-4 complete.

### Deliverables

- [ ] **PHASE-5.1** Type: external-check — Full `npm run test` (jest + hardhat) passes; no new regressions vs. the pre-existing baseline established earlier this session
- [ ] **PHASE-5.2** Type: external-check — `tsc --noEmit` clean
- [ ] **PHASE-5.3** Type: external-check — `npm run build` (or `npm run cf:build`) succeeds
- [ ] **PHASE-5.4** Type: review — Manual QA pass: full user journey (landing → connect → create with each tier including genesis → contribute → complete → both NFT states) walked through by drdeeks personally, not just Claude
- [ ] **PHASE-5.5** review-phase5.md Type: review

### Validation Gate

> All automated checks green AND a human has actually clicked through the real flow before Phase 6 begins — this is exactly the kind of thing that looks fine in code and breaks in the browser.

### Rollback Procedure

1. Any failure here blocks Phase 6 outright — fix forward in Phase 1-4's files, do not skip ahead.

---
### PHASE-6: Launch & Live Ops

**Section Tag:** `[PHASE-6-v1]`
**Feature Flag:** `FEAT_LAUNCH_LIVE_OPS`
**Assigned Agent:** claude (this session)
**Reviewer Agent:** drdeeks (project owner)

### Prerequisites

Phase 5 complete.

### Deliverables

- [ ] **PHASE-6.1** Type: approval — drdeeks explicitly approves the mainnet redeploy (real gas cost, real irreversible contract addresses)
- [ ] **PHASE-6.2** Type: external-check — Contracts redeployed to Base (and Monad, once Monad deployment happens per the earlier multi-chain work); `deployment.json`/per-chain records updated; `NEXT_PUBLIC_*_ADDRESS` env vars and Cloudflare Worker secrets updated to match
- [ ] **PHASE-6.3** Type: external-check — `npm run cf:deploy` run, live site smoke-tested at `ghostwriter.drdeeks.xyz`
- [ ] **PHASE-6.4** review-phase6.md Type: review

### Validation Gate

> Live smoke test on the actual production URL, not just local/preview, before this phase closes.

### Rollback Procedure

1. Old contract addresses remain valid and untouched (this is a fresh deploy, not an upgrade) — reverting the frontend's env vars to the old addresses instantly reverts user-facing behavior without any contract action needed.
2. If the new contracts have a critical bug post-launch, `emergencyWithdraw` (existing, unchanged) protects funds while a fix is prepared.

---

---

---

# PART VII — QUALITY & COMPLIANCE STANDARDS

> **Rollback Tag:** `[QUALITY-v1]`

## Error Handling Standards

1. Every new external call (Neynar, each AI provider) degrades gracefully — never blocks story creation entirely (SPEC-005's fallback chain is the model for this).
2. User-facing messages: friendly, no stack traces, no raw provider error text exposed to end users.
3. Internal logging: full context on failures (which provider/service failed, why) for debugging, same pattern as the existing `console.warn` failover logging in ai-service.ts.
4. Retry: reuse the existing per-provider retry/backoff already built into `AIService.generateWithFailover`.
5. Contract reverts fail closed, never silently — e.g. an invalid optional `firstWord` reverts the whole creation tx rather than silently dropping the word (SPEC-002).

## Testing Requirements

- Every new/changed contract function gets at least 1 Hardhat test (genesis creation, optional first-word both paths, immediate mint timing).
- Every new/changed API route gets at least 1 route test (generate-story new shape, neynar proxy, nft metadata/image hidden+revealed).
- The sentence-extraction utility (Phase 4) gets dedicated unit tests given it's the trickiest new logic in this project.
- Manual QA (Phase 5.4) is mandatory, not optional — this project's prior sessions have shown code that type-checks and builds but doesn't actually work as intended in the browser.

## Performance Budgets

| Metric | Budget |
|---|---|
| Title/teaser generation (5 suggestions) | < 8 seconds end-to-end across the AI failover chain |
| "??" roast generation (incl. Neynar fetch) | < 10 seconds |
| NFT image render (hidden or revealed) | < 1 second |
| Story creation transaction (client-perceived, excl. chain confirmation) | < 2 seconds to submit |
| Neynar profile fetch | < 3 seconds, non-blocking fallback to surprise mode on timeout |
| Contract bytecode size (StoryManager) | Must stay under 24576 bytes (EIP-170) — currently 24003, only 573 bytes of headroom |

> **PROJECT tier requires 6+ concrete metrics** — 6 provided above.

---

---

# REFERENCE DOCUMENTATION

Supplied by drdeeks for use while implementing the phases below — check
these before guessing at API shapes or SDK behavior.

| Source | URL | Relevant to |
|---|---|---|
| Neynar full docs | https://docs.neynar.com/llms-full.txt | Phase 2 (MOD-002 Neynar Identity Service) — API auth, profile/user endpoints, casts, scoring |
| Farcaster docs | https://docs.farcaster.xyz/ | Phase 2 & 3 — FID semantics, protocol concepts underlying Neynar's API |
| Farcaster miniapps full docs | https://miniapps.farcaster.xyz/llms-full.txt | Phase 3 (MOD-003/MOD-004) — confirms `useFarcaster()`/miniapp-sdk context detection is still current against the latest miniapp spec before building the "??" Farcaster-vs-not branch on top of it |
| Monad docs | https://docs.monad.xyz/ | Phase 6 (Launch & Live Ops) — Monad mainnet deployment specifics when redeploying the Phase 1 contract changes there |
| HyperSnap (Quilibrium) | https://hypersnap-docs.qstorage.quilibrium.com/llms.txt | Not yet mapped to a specific phase above — flag to drdeeks during Phase 4 (NFT metadata/image) if this is intended as the image/metadata storage layer, since that wasn't specified when this blueprint was written |

---

---

# CHANGE LOG

> This section is append-only. No entry may be modified or deleted.

## CL-0000 — Document Initialization

```
Date        : 2026-08-05
Contributor : claude (this session)
Modules     : [MOD-001, MOD-002, MOD-003, MOD-004, MOD-005]
Section Tags: [[PHASE-0-v1]]
Files Changed: [blueprint.md, checklist.md]
Description : Blueprint fully populated covering the 4-piece plan agreed
              with drdeeks: contract changes (genesis story, optional
              atomic first-word, immediate creator-NFT mint), new
              Neynar identity integration, reworked creation-flow UX
              (title+teaser suggestions plus a Farcaster-aware "??"
              roast/surprise wildcard), and an NFT hidden/revealed
              rendering redesign. Adapted the generic SQL/multi-agent
              template to this project's real shape: on-chain storage
              instead of a SQL DB, solo-dev-plus-AI-assistant review
              instead of a multi-agent crew.
Tests Passing: none — pre-build
Phase       : PHASE-0
Rollback Ref: N/A — initial document creation
```
