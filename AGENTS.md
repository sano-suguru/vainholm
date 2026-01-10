# AGENTS.md - Vainholm

Guidelines for AI agents working in this React + TypeScript + Pixi.js tile-based game codebase.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Type-check (`tsc -b`) + Vite build |
| `pnpm lint` | ESLint on all files |
| `pnpm preview` | Preview production build |
| `pnpm similarity` | Detect duplicate code (threshold 0.7) |
| `pnpm similarity:types` | Duplicate detection with type analysis |
| `pnpm deadcode` | Detect unused files, exports, dependencies |
| `pnpm deadcode:fix` | Auto-fix unused exports |

**Package Manager**: pnpm 10.12.1 (enforced via `packageManager` field)
**No test framework configured.**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite 7 |
| Rendering | Pixi.js 8 via `@pixi/react` (WebGL 2D) |
| Language | TypeScript 5.9 (strict, all flags) |
| State | Zustand 5 |
| Styling | CSS Modules (`.module.css`) |

## Architecture: Dual Rendering

**CRITICAL**: Two rendering systems coexist:

| System | Handles | Location |
|--------|---------|----------|
| React DOM | Layout, events, debug overlays | `GameContainer.tsx` |
| Pixi.js Canvas | All visual game content | `PixiViewport.tsx` |

See `src/components/game/AGENTS.md` for Pixi.js patterns.

## Project Structure

```
src/
├── components/
│   ├── game/          # Pixi.js rendering + React container (see game/AGENTS.md)
│   └── ui/            # Debug overlays (DebugInfo)
├── hooks/             # useKeyboard, useViewport, usePerformanceMetrics
├── stores/            # Zustand gameStore (single store pattern)
├── styles/            # CSS modules + variables
├── types/             # Type definitions barrel (index.ts)
└── utils/             # Map generation, constants, glyphs, color cache
```

## Code Map (Key Symbols)

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `useGameStore` | Hook | `stores/gameStore.ts` | Global state access |
| `GameStore` | Interface | `stores/gameStore.ts` | State shape definition |
| `PixiViewport` | Component | `components/game/PixiViewport.tsx` | WebGL rendering (11 layers) |
| `GameContainer` | Component | `components/game/GameContainer.tsx` | React orchestrator |
| `generateMapData` | Function | `utils/mapGeneratorCore.ts` | Procedural map generation |
| `TILE_DEFINITIONS` | Constant | `utils/constants.ts` | Tile properties (walkable, cost, glyph) |
| `TILE_GLYPHS` | Constant | `utils/tileGlyphs.ts` | Glyph rendering data |
| `Position` | Interface | `types/index.ts` | `{ x: number, y: number }` |
| `MapData` | Interface | `types/index.ts` | Map structure definition |
| `ViewportBounds` | Interface | `types/index.ts` | Camera bounds |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add tile type | `utils/constants.ts` + `utils/tileGlyphs.ts` | Define properties then glyph |
| Change rendering | `components/game/PixiViewport.tsx` | 11 layers, add after appropriate layer |
| Modify player movement | `stores/gameStore.ts` → `movePlayer` | Handles collision + visibility |
| Add keyboard binding | `utils/constants.ts` → `KEY_BINDINGS` | Then handle in `useKeyboard.ts` |
| Change viewport size | `utils/constants.ts` → `VIEWPORT_*_TILES` | Affects camera bounds |
| Add game state | `stores/gameStore.ts` | Add to interface + implementation |
| Debug rendering | Enable `debugMode` (F3 key) | Shows FPS, frame time, memory |

## Import Order (ENFORCED)

```typescript
// 1. React
import { memo, useCallback, useEffect, useRef, useState } from 'react';

// 2. External libraries
import { create } from 'zustand';

// 3. Types (type imports first)
import type { Direction, MapData, Position } from '../types';

// 4. Internal modules
import { useGameStore } from '../../stores/gameStore';
import { TILE_SIZE } from '../../utils/constants';

// 5. Styles (last)
import styles from '../../styles/game.module.css';
```

## TypeScript Patterns

**Strict mode enabled** - all flags active:
- `noUnusedLocals`, `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `noUncheckedSideEffectImports`
- `verbatimModuleSyntax`

```typescript
// Use type imports for type-only
import type { Position } from '../types';

// Interface for props
interface TileProps {
  type: TileType;
  position: Position;
}

// Export types from barrel
export type { Position, MapData, TileType } from './types';
```

## React Component Pattern

```typescript
// Function declaration + memo for performance-critical components
export const Tile = memo(function Tile({ type }: TileProps) {
  return <div className={`${styles.tile} ${tileStyleMap[type]}`} />;
});
```

- **Function declarations** (not arrow functions)
- **`memo()`** for frequently re-rendered components
- **Named function inside memo** for debugging
- **Barrel exports** via `index.ts`

## Custom Hook Pattern

```typescript
interface UseKeyboardOptions {
  onMove: (dx: number, dy: number) => void;
  moveDelay?: number;
}

export function useKeyboard({ onMove, moveDelay = 150 }: UseKeyboardOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // implementation
  }, [onMove, moveDelay]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

## Zustand Store Pattern

```typescript
export const useGameStore = create<GameStore>((set, get) => ({
  player: { position: { x: 50, y: 50 }, facing: 'down' },
  map: null,

  movePlayer: (dx, dy) => {
    const { player, canMoveTo } = get();
    if (!canMoveTo(player.position.x + dx, player.position.y + dy)) return;
    set({ player: { ...player, position: { x: newX, y: newY } } });
  },

  getTileAt: (x, y) => {
    const { map } = get();
    if (!map) return null;
    // defensive null checks
    return map.tileMapping[String(tileId)] || null;
  },
}));
```

## Web Worker Pattern (Map Generation)

Map generation uses Web Workers to prevent UI blocking:

```
mapGenerator.ts          → Thin wrapper (public API)
mapGenerator.worker.ts   → Worker entry point
mapGeneratorCore.ts      → Actual generation logic
generateMapAsync.ts      → Async orchestrator
```

**Usage**:
```typescript
import { generateMapAsync } from '../utils/generateMapAsync';

const map = await generateMapAsync(MAP_WIDTH, MAP_HEIGHT, seed);
```

**Why**: Procedural generation is CPU-intensive. Worker keeps UI responsive.

## Constants Pattern

```typescript
// utils/constants.ts
export const TILE_SIZE = 16;
export const MAP_WIDTH = 200;
export const MAP_HEIGHT = 200;

export const KEY_BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  debug: ['F3'],
} as const;

export const TILE_DEFINITIONS = {
  grass: { type: 'grass', walkable: true, movementCost: 1, name: 'Grass', char: '.' },
  // ...
} as const;
```

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase | `GameContainer`, `PixiViewport` |
| Hooks | camelCase + `use` | `useKeyboard`, `useViewport` |
| Store | camelCase + `Store` | `gameStore` |
| Types | PascalCase | `Position`, `MapData` |
| Constants | SCREAMING_SNAKE | `TILE_SIZE`, `MAP_WIDTH` |
| CSS classes | camelCase | `.gameContainer` |
| Functions | camelCase | `generateMap`, `seededRandom` |
| Files | camelCase (utils), PascalCase (components) | `useKeyboard.ts`, `GameContainer.tsx` |

## Error Handling

- **Early returns** with null checks
- **Defensive coding** over try/catch for expected states
- **Return null** from stores/utils when data unavailable

```typescript
getTileAt: (x, y) => {
  const { map } = get();
  if (!map) return null;
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return null;
  return map.tileMapping[String(tileId)] || null;
};
```

## Performance

- **`memo()`** on frequently re-rendered components
- **`useCallback`** for handlers passed as props
- **`useRef`** for mutable values that don't need re-renders
- **`useMemo`** for expensive computations
- **Avoid inline object/array creation** in JSX props
- **Visibility hashing** for fog-of-war optimization

## Anti-Patterns (FORBIDDEN)

| Pattern | Why |
|---------|-----|
| `any` type | Use proper types or `unknown` with guards |
| `@ts-ignore` / `@ts-expect-error` | Fix the type error properly |
| Inline styles (complex) | Use CSS modules |
| Business logic in components | Extract to hooks or utils |
| Deep imports (`../../..`) | Max `../` depth, refactor if deeper |
| React DOM in PixiViewport | Pixi handles ALL visual rendering |

## Code Quality Tools

### similarity-ts

Detect duplicate code:

```bash
pnpm similarity              # Basic (threshold 0.7)
pnpm similarity:types        # Include type analysis
similarity-ts src/ --threshold 0.9 --print  # Stricter
```

| Similarity | Action |
|------------|--------|
| 100% | Extract to shared module immediately |
| 80-99% | Strong refactoring candidate |
| 70-79% | Review for abstraction |
| <70% | Usually false positive |

### knip

Detect dead code (unused files, exports, dependencies):

```bash
pnpm deadcode           # Report unused code
pnpm deadcode:fix       # Auto-remove unused exports
```

| Detection Target | Description |
|------------------|-------------|
| Unused files | Files not imported anywhere |
| Unused exports | Exported but never imported |
| Unused dependencies | Listed in package.json but unused |
| Unused types | Type exports never referenced |

Configuration: `knip.json`
