# Implementation Checklist

*Generated from `blueprint.md` on 2026-08-05T07:53:35.575566Z*

## Summary
- **Project:** Creation Flow, Roast Mode & NFT Rework
- **Phases:** 7
- **Tasks:** 31
- **Modules:** 5
- **Screens:** 0
- **Mode:** loop
- **Validators:** disabled

## Phase Checklist

### [PHASE-0-v1] — PHASE-0: Pre-Build

**Flag:** `FEAT_PRE_BUILD`

- [ ] **PHASE-0.1** Type: approval — This blueprint reviewed and approved by drdeeks
- [ ] **PHASE-0.2** Type: external-check — Neynar API key acquired (https://neynar.com), added to `.env` as `NEYNAR_API_KEY`
- [ ] **PHASE-0.3** review-phase0.md

### [PHASE-1-v1] — PHASE-1: Foundation (Contract Layer — MOD-001)

**Flag:** `FEAT_CONTRACT_V2`

- [ ] **PHASE-1.1** Type: file — `contracts/StoryManager.sol`: `createGenesisStory` (SPEC-001), optional `firstWord` param on `createStoryApproved` (SPEC-002), `mintCreatorNFT` call moved to creation time (SPEC-003), story-title-to-numeric-ID tracking (§4.1)
- [ ] **PHASE-1.2** Type: file — `contracts/GhostWriterNFT.sol`: `NFTData` struct gains `firstWordByCreator`; `mintCreatorNFT` no longer called from the finalization path
- [ ] **PHASE-1.3** Type: file — `test-contracts/StoryManager.test.js`: tests for genesis-story creation (owner-only, unbounded slots), optional first-word (both provided and omitted), immediate creator-NFT mint (verify NFT exists right after `createStoryApproved`, not after finalization)
- [ ] **PHASE-1.4** Type: external-check — `npx hardhat test` passes locally, `npx hardhat compile` produces bytecode under the EIP-170 24576-byte limit (StoryManager was already at 24003/24576 before this phase — recheck after these additions)
- [ ] **PHASE-1.5** review-phase1.md

### [PHASE-2-v1] — PHASE-2: Authentication & Identity (Neynar Integration — MOD-002)

**Flag:** `FEAT_NEYNAR_IDENTITY`

- [ ] **PHASE-2.1** Type: file — `src/lib/neynar-service.ts` (NEW): `getUserProfile(fid)` fetching profile, follower count, Neynar score, recent casts from Neynar's API, server-side only
- [ ] **PHASE-2.2** Type: file — `src/app/api/neynar/profile/route.ts` (NEW): thin server route proxying `neynar-service.ts` so `NEYNAR_API_KEY` never reaches the client
- [ ] **PHASE-2.3** Type: file — Env docs: `.env.example` gets `NEYNAR_API_KEY` documented (following this session's existing pattern for optional-provider keys)
- [ ] **PHASE-2.4** review-phase2.md

### [PHASE-3-v1] — PHASE-3: Core Feature Build (Creation Flow UI — MOD-003, MOD-004)

**Flag:** `FEAT_CREATION_FLOW_V2`

- [ ] **PHASE-3.1** Type: file — `src/lib/ai-service.ts`: new prompt path for title+teaser generation (SPEC-004, replaces full-template generation for the suggestion step)
- [ ] **PHASE-3.2** Type: file — `src/lib/ai-service.ts`: new roast-prompt builder consuming Neynar profile data (SPEC-005), and a non-Farcaster "surprise" prompt variant
- [ ] **PHASE-3.3** Type: file — `src/app/api/generate-story/route.ts`: response shape change to `{title, teaser}[]`, new wildcard-mode request handling
- [ ] **PHASE-3.4** Type: file — `src/components/story/story-creation-modal.tsx`: category picker → 5 title/teaser cards + "??" card, optional first-word input wired to the Phase-1 contract param
- [ ] **PHASE-3.5** Type: file — `src/hooks/useContract.ts` or a new hook: wires the optional `firstWord` and `createGenesisStory` (admin-only, Settings tab) into `useStoryManager`
- [ ] **PHASE-3.6** review-phase3.md

### [PHASE-4-v1] — PHASE-4: Integration Layer (NFT Metadata & Image — MOD-005)

**Flag:** `FEAT_NFT_REWORK`

- [ ] **PHASE-4.1** Type: file — `src/app/api/nft/[tokenId]/route.ts`: metadata schema per §4.2, hidden vs revealed branching
- [ ] **PHASE-4.2** Type: file — `src/app/api/nft/[tokenId]/image/route.ts`: hidden-state render (SPEC-006, exact layout spec), revealed-state single-sentence-with-bolded-word render (SPEC-007)
- [ ] **PHASE-4.3** Type: file — Sentence-extraction utility (new, likely `src/lib/`) that correctly locates the sentence containing a given word position in the finalized template — this is the one genuinely tricky piece of logic in this phase and deserves its own unit tests
- [ ] **PHASE-4.4** review-phase4.md

### [PHASE-5-v1] — PHASE-5: Testing & Hardening

**Flag:** `FEAT_TESTING_HARDENING`

- [ ] **PHASE-5.1** Type: external-check — Full `npm run test` (jest + hardhat) passes; no new regressions vs. the pre-existing baseline established earlier this session
- [ ] **PHASE-5.2** Type: external-check — `tsc --noEmit` clean
- [ ] **PHASE-5.3** Type: external-check — `npm run build` (or `npm run cf:build`) succeeds
- [ ] **PHASE-5.4** Type: review — Manual QA pass: full user journey (landing → connect → create with each tier including genesis → contribute → complete → both NFT states) walked through by drdeeks personally, not just Claude
- [ ] **PHASE-5.5** review-phase5.md

### [PHASE-6-v1] — PHASE-6: Launch & Live Ops

**Flag:** `FEAT_LAUNCH_LIVE_OPS`

- [ ] **PHASE-6.1** Type: approval — drdeeks explicitly approves the mainnet redeploy (real gas cost, real irreversible contract addresses)
- [ ] **PHASE-6.2** Type: external-check — Contracts redeployed to Base (and Monad, once Monad deployment happens per the earlier multi-chain work); `deployment.json`/per-chain records updated; `NEXT_PUBLIC_*_ADDRESS` env vars and Cloudflare Worker secrets updated to match
- [ ] **PHASE-6.3** Type: external-check — `npm run cf:deploy` run, live site smoke-tested at `ghostwriter.drdeeks.xyz`
- [ ] **PHASE-6.4** review-phase6.md

## Module Registry
| Module ID | Name | Purpose | Flag |
|---|---|---|---|
| MOD-001 | Contract Layer | StoryManager/GhostWriterNFT changes: genesis-story | `FEAT_CONTRACT_V2` |
| MOD-002 | Neynar Identity Service | New service module fetching a Farcaster user's pro | `FEAT_NEYNAR_IDENTITY` |
| MOD-003 | Creation Flow UI | Category picker → 5 title+teaser suggestions + alw | `FEAT_CREATION_FLOW_V2` |
| MOD-004 | Roast/Wildcard Generation | New AI prompt path in ai-service.ts: Farcaster-awa | `FEAT_ROAST_MODE` |
| MOD-005 | NFT Metadata & Image Rendering | Rewrite of `/api/nft/[tokenId]` (metadata) and `/a | `FEAT_NFT_REWORK` |

## Feature Flags
| Flag | Phases | Modules | Screens |
|---|---|---|---|
| FEAT_PRE_BUILD | PHASE-0 |  |  |
| FEAT_CONTRACT_V2 | PHASE-1 |  |  |
| FEAT_NEYNAR_IDENTITY | PHASE-2 |  |  |
| FEAT_CREATION_FLOW_V2 | PHASE-3 |  |  |
| FEAT_NFT_REWORK | PHASE-4 |  |  |
| FEAT_TESTING_HARDENING | PHASE-5 |  |  |
| FEAT_LAUNCH_LIVE_OPS | PHASE-6 |  |  |
| `FEAT_CONTRACT_V2` |  | Contract Layer |  |
| `FEAT_NEYNAR_IDENTITY` |  | Neynar Identity Service |  |
| `FEAT_CREATION_FLOW_V2` |  | Creation Flow UI |  |
| `FEAT_ROAST_MODE` |  | Roast/Wildcard Generation |  |
| `FEAT_NFT_REWORK` |  | NFT Metadata & Image Rendering |  |
