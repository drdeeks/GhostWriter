# AGENTS.md — Ghost Writer

## Commands

```bash
npm run dev              # Next.js dev server
npm run build            # Production build (Vercel)
npm run ts-check         # TypeScript check (no emit)
npm run lint             # ESLint
npm run compile          # Hardhat Solidity compile
npm test                 # Hardhat contract tests
npm run test:frontend    # Jest frontend tests
npm run test:frontend:coverage  # Jest with coverage
npm run deploy:baseSepolia      # Deploy to Base Sepolia
npm run deploy:base             # Deploy to Base mainnet
```

## Dependency quirks

- **`npm install --legacy-peer-deps`** is required on first install (vercel.json sets this). Peer dep conflicts between wagmi/viem/ethers are expected.
- Babel presets (`@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript`) and `@babel/core` must be in **`dependencies`**, not `devDependencies`, or Vercel production builds fail with "Cannot find module '@babel/preset-env'".
- `@farcaster/miniapp-sdk` must be `^0.2.3` to satisfy `@farcaster/miniapp-wagmi-connector` peer dep.

## Solidity config

- Compiler: `0.8.28` with `evmVersion: "cancun"` — required because OpenZeppelin v5 uses `mcopy` instruction.
- `contracts/LiquidityPool.sol` has event named `Deposited` (not `Deposit`). The `receive()` function had a typo — if editing this file, verify event name matches.

## Dark theme

- `<html className="dark">` in `src/app/layout.tsx` is required for Tailwind `dark:` variants to activate globally.
- `globals.css` defines dark theme CSS variables under `:root` (no `.dark` class needed since the class is always present).

## Architecture

- **Next.js 16** (App Router) + **Turbopack** for frontend.
- **Hardhat 2** + **ethers v6** for Solidity contracts and deployment.
- **wagmi/viem** for on-chain interaction; **@coinbase/onchainkit** for wallet UI.
- **Farcaster Mini App** integration via `@farcaster/miniapp-sdk` and `@farcaster/miniapp-wagmi-connector`.
- Contracts deploy to **Base** (chain 8453) or **Base Sepolia** (84532). `NEXT_PUBLIC_CHAIN_ID` in `.env` selects which.
- After deployment, run `npx hardhat run scripts/set-signer.js --network <network>` to register the EIP-712 story template signer.

## Testing

- Contract tests: `test/` directory, run with `npm test` (Hardhat). Currently no test files present — tests were likely removed or not committed.
- Frontend tests: `src/**/*.test.{ts,tsx}`, run with `npm run test:frontend` (Jest + jsdom). 10 tests across hooks and lib modules.
- Jest transforms `@/` paths via `moduleNameMapper`. `transformIgnorePatterns` excludes `@farcaster`, `@coinbase`, `wagmi`, `viem` from ignoring.

## CI / Deploy

- Vercel deploy via `vercel.json`: `npm install --legacy-peer-deps`, then `npm run build`.
- `NODE_ENV=production` is set in `vercel.json` build env.
- API routes have `maxDuration: 30` (serverless function timeout).
