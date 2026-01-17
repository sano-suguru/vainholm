# AGENTS.md - Vainholm

**Generated**: 2026-01-17 | **Commit**: cd9545c | **Branch**: main | **Tests**: 88 passing

Dark fantasy dungeon crawler: React 19 + Pixi.js 8 + Zustand 5 + TypeScript 5.9 (strict).

## Communication

- Always respond in Japanese unless explicitly instructed otherwise
- 日本語で応答すること（特に指示がない限り）

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Type-check (`tsc -b`) + Vite build |
| `pnpm lint` | ESLint on all files |
| `pnpm test` | Vitest run (88 tests) |
| `pnpm similarity` | Detect duplicate code (threshold 0.7) |
| `pnpm deadcode` | Detect unused files/exports (knip) |

**Package Manager**: pnpm 10.28.0 (enforced)

## Architecture: Dual Rendering

**CRITICAL**: Two rendering systems coexist:

| System | Handles | Location |
|--------|---------|----------|
| React DOM | Layout, events, debug overlays | `GameContainer.tsx` |
| Pixi.js Canvas | ALL visual game content | `PixiViewport.tsx` (21 layers) |

See `src/components/game/AGENTS.md` for Pixi.js patterns.

## Project Structure

```
src/
├── components/
│   ├── game/          # Pixi.js rendering (see game/AGENTS.md)
│   └── ui/            # HUD (hud/), debug overlay, game over screen
├── hooks/             # useKeyboard, useViewport, usePerformanceMetrics, useEffectProcessor
├── stores/            # Zustand stores (5 separate stores)
├── dungeon/           # Dungeon generation system (see dungeon/AGENTS.md)
├── combat/            # Turn-based combat (see combat/AGENTS.md)
├── progression/       # Level-up, upgrades, abilities
├── items/             # Inventory, consumables
├── tiles/             # Tile registry: 63 types, ID mapping
├── types/             # Type definitions barrel
├── utils/             # Map generation, constants, textures (see utils/AGENTS.md)
│   └── mapGeneration/ # Phase-based pipeline (see mapGeneration/AGENTS.md)
├── paraglide/         # Generated i18n (Paraglide.js, ja/en)
└── assets/tiles/      # SVG textures (terrain, connected, transitions, overlays, animated)

docs/
└── GAME_DESIGN.md     # World setting (Vainholm), 4 regions, 8 floors (normal) / 16 floors (advanced)
```

## Code Map

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `useGameStore` | Hook | `stores/gameStore.ts` | Main state (955 lines) |
| `useDungeonStore` | Hook | `dungeon/dungeonStore.ts` | Dungeon state |
| `useProgressionStore` | Hook | `progression/progressionStore.ts` | Level-up state |
| `useInventoryStore` | Hook | `items/inventoryStore.ts` | Inventory state |
| `useDamageNumberStore` | Hook | `stores/damageNumberStore.ts` | Floating damage |
| `PixiViewport` | Component | `components/game/PixiViewport.tsx` | WebGL rendering (21 layers) |
| `GameContainer` | Component | `components/game/GameContainer.tsx` | React orchestrator |
| `generateMapAsync` | Function | `utils/generateMapAsync.ts` | Web Worker map generation |
| `TILE_REGISTRY` | Constant | `tiles/registry.ts` | 63 tile definitions |
| `executeTurn` | Function | `combat/turnManager.ts` | Turn execution entry point |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add tile type | `tiles/registry.ts` + `utils/tileTextures.ts` | ID, properties, texture/fallback |
| Change rendering | `components/game/PixiViewport.tsx` | 21 layers, add after appropriate layer |
| Modify player movement | `stores/gameStore.ts` → `movePlayer` | Collision + visibility delta |
| Add keyboard binding | `utils/constants.ts` → `KEY_BINDINGS` | Then `hooks/useKeyboard.ts` |
| Add game state | `stores/gameStore.ts` | Interface + implementation |
| Add tile interaction | `utils/tileInteractions.ts` | Triggers, effects, chain reactions |
| Add dungeon region | `dungeon/config/` | Region config + add to index |
| Add map generation phase | `utils/mapGeneration/phases/` | See mapGeneration/AGENTS.md |
| Add enemy type | `combat/enemyTypes.ts` | Stats, behavior, spawning |
| Add upgrade | `progression/upgrades.ts` | Stats, effects, requirements |
| Add item | `items/consumables.ts` | Effect, stacking |
| Debug rendering | Press F3 | Shows FPS, frame time, memory |

## Import Order (ENFORCED)

```typescript
// 1. React
import { memo, useCallback, useEffect } from 'react';

// 2. External libraries
import { create } from 'zustand';

// 3. Types (type imports)
import type { Position, MapData } from '../types';

// 4. Internal modules
import { useGameStore } from '../../stores/gameStore';
import { TILE_SIZE } from '../../utils/constants';

// 5. Styles (last)
import styles from '../../styles/game.module.css';
```

## TypeScript Patterns

**Strict mode** — all flags active:
- `noUnusedLocals`, `noUnusedParameters` (use `_` prefix to ignore)
- `verbatimModuleSyntax` (enforces `import type`)
- `erasableSyntaxOnly` (TypeScript 5.9)

```typescript
// Use type imports for type-only
import type { Position } from '../types';

// Function declaration + memo for components
export const Tile = memo(function Tile({ type }: TileProps) {
  return <div />;
});
```

## Web Worker Pattern

Map generation runs in Web Worker (CPU-intensive):

```
generateMapAsync.ts  →  mapGenerator.worker.ts  →  mapGeneratorCore.ts
     Public API              Worker entry            Pure function
```

**Never**: Import `mapGeneratorCore` directly in main thread.

## Multi-Store Pattern

**5 independent Zustand stores** (not monolithic):

| Store | Purpose | Location |
|-------|---------|----------|
| `gameStore` | World map, player, visibility, weather, time, combat | `stores/gameStore.ts` |
| `dungeonStore` | Dungeon floors, navigation, regions | `dungeon/dungeonStore.ts` |
| `progressionStore` | Level-up, upgrades, abilities | `progression/progressionStore.ts` |
| `inventoryStore` | Items, consumables, slots | `items/inventoryStore.ts` |
| `damageNumberStore` | Floating damage animation | `stores/damageNumberStore.ts` |

**Cross-store calls**: Use `.getState()` for inter-store communication.

**Transition**: `cacheWorldMap()` / `restoreWorldMap()` for world↔dungeon swaps.

## Visibility Delta Optimization

Player visibility uses incremental delta for 1-tile moves:
```typescript
getVisibilityDelta(oldX, oldY, newX, newY): { toAdd: Position[], toRemove: Position[] }
```

**Visibility Hash**: `playerX * 10000 + playerY` — memoization key for FogOfWarLayer.

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase | `GameContainer` |
| Hooks | camelCase + `use` | `useKeyboard` |
| Types | PascalCase | `Position`, `MapData` |
| Constants | SCREAMING_SNAKE | `TILE_SIZE`, `MAP_WIDTH` |
| Files | camelCase (utils), PascalCase (components) | `useKeyboard.ts`, `GameContainer.tsx` |

## Anti-Patterns (FORBIDDEN)

| Pattern | Why |
|---------|-----|
| `any` type | Use proper types or `unknown` with guards |
| `@ts-ignore` / `@ts-expect-error` | Fix the type error properly |
| Inline TextStyle/BlurFilter | Recreated every render — memoize at module level |
| React DOM in PixiViewport | Pixi handles ALL visual rendering |
| Import `mapGeneratorCore` in main thread | CPU-intensive, blocks UI |
| Deep imports (`../../../..`) | Max 3 levels, refactor if deeper |
| Business logic in components | Extract to hooks or utils |
| Hooks in combat functions | Combat runs outside render cycle |
| Cross-store direct mutation | Use store actions |

## Tile System

**63 tile types** across categories:

| Category | Examples | Count |
|----------|----------|-------|
| Terrain | grass, water, sand, snow, lava | 9 |
| Features | forest, mountain, hills, wall | 4 |
| Dungeon | dungeon_floor, dungeon_wall, stairs_* | 4 |
| Doors | door, door_open, door_locked, door_secret | 4 |
| Traps | trap_spike, trap_pit, pressure_plate, web | 4 |
| Hazards | miasma, blight, toxic_marsh, cursed_ground | 6 |
| Structures | pillar, altar_dark, brazier, wall_torch | 8 |
| Decay | blood, bone_pile, rubble, lichen | 7 |
| Animated | water, lava, swamp, wall_torch (11 types × 4 frames) | 11 |

**Texture Fallback**: 43 tiles reuse 14 base SVGs. See `utils/tileTextures.ts`.

## Testing

**Framework**: Vitest 4.0.16 (88 tests passing)

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `mapGeneratorCore.test.ts` | 56 | Procedural generation, determinism |
| `floorGenerator.test.ts` | 19 | Dungeon connectivity, reachability |
| `LightLayer.test.ts` | 6 | Light calculations |
| `progressionStore.test.ts` | 3 | Upgrade selection |
| `i18n.test.ts` | 4 | Localization |

**Pattern**: Co-located tests (`.test.ts`), seeded randomness for determinism, no mocking.

```bash
pnpm test        # Run once
pnpm test:watch  # Watch mode
```

## Performance

- **`memo()`** on frequently re-rendered components (all Pixi layers)
- **`useCallback`** for handlers passed as props
- **`useMemo`** for expensive computations
- **`useShallow`** for multi-field Zustand selectors
- **Visibility hashing** for FogOfWarLayer memoization
- **Texture caching** — SVGs loaded once, reused
- **Module-level filters** — BlurFilter wrapped in IIFE

## Code Quality

| Tool | Purpose | Command |
|------|---------|---------|
| similarity-ts | Duplicate detection | `pnpm similarity` |
| knip | Dead code detection | `pnpm deadcode` |
| ESLint | Linting (flat config) | `pnpm lint` |
| TypeScript | Type checking | `pnpm build` |

## Complexity Hotspots

| File | Lines | Notes |
|------|-------|-------|
| `PixiViewport.tsx` | 1371 | 21 layers — candidate for splitting |
| `gameStore.ts` | 955 | Visibility delta, map caching, combat |
| `floorGenerator.ts` | 870 | Dungeon floor pipeline, collapse zones |
| `tileTextures.ts` | 682 | 168 imports — fallback chain |
| `bspGenerator.ts` | 355 | BSP algorithm, Union-Find |
| `tileInteractions.ts` | 323 | 35+ interactions, chain reactions |

## Subdirectory Documentation

| Path | Purpose |
|------|---------|
| `src/components/game/AGENTS.md` | Pixi.js 21-layer rendering |
| `src/components/ui/hud/AGENTS.md` | React DOM HUD overlay |
| `src/dungeon/AGENTS.md` | BSP dungeon generation |
| `src/utils/AGENTS.md` | Utilities, textures, lighting |
| `src/combat/AGENTS.md` | Turn-based combat system |
| `src/utils/mapGeneration/AGENTS.md` | Phase-based generation pipeline |
