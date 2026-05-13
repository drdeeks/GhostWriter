# ⚡ Bolt Optimization: useStories Hook Memoization

## 💡 What
Optimized the `useStories` custom hook in `src/hooks/useStories.ts` by implementing comprehensive memoization of intermediate computations and the final result.

## 🎯 Why
The previous implementation was creating new array references for `ids`, `contracts`, and `stories` on every single render. Since `useReadContracts` is a core hook used in the main dashboard, this was causing:
1. Redundant internal effect triggers within wagmi/tanstack-query.
2. Breaking `React.memo` optimizations in downstream components (like `StoryCard`) because the `stories` array reference changed every time, even if the content was identical.
3. Inefficient data transformation using multiple array passes (`map` -> `filter` -> `map`).

## 📊 Impact
- **Reduces re-renders:** Components consuming `useStories` (like the Home page) will no longer trigger re-renders of all story cards unless the contract data actually changes.
- **Reference Stability:** Provides a stable `stories` array, allowing `React.memo` on `StoryCard` to function as intended.
- **Algorithmic efficiency:** Improved data transformation from O(3n) to O(n).

## 🔬 Measurement
1. Open React Developer Tools.
2. Observe the `Home` component and `StoryCard` components.
3. Toggle a piece of local state in `Home` that doesn't affect stories (e.g., a modal open/close).
4. **Before:** All `StoryCard` components would re-render.
5. **After:** `StoryCard` components remain idle because their `story` prop (derived from the memoized `stories` array) maintains referential equality.

## 🛠 Changes
- Added `useMemo` for `ids` calculation.
- Added `useMemo` for `contracts` array generation.
- Replaced `.map().filter().map()` chain with a single-pass `for...of` loop inside a `useMemo` block for the final `stories` result.
