# AGENTS.md - src/utils

**Generated**: 2026-01-20 | **Commit**: 01d37f0 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Utility layer: map generation, rendering data, game systems, configuration.

## File Roles

| File | Purpose | Lines | Consumers |
|------|---------|-------|-----------|
| `constants.ts` | TILE_SIZE (16px), MAP_*, VIEWPORT_*, KEY_BINDINGS | — | 10+ files |
| `mapGeneratorCore.ts` | Procedural generation (pure function, 56 tests) | — | Worker only |
| `generateMapAsync.ts` | Web Worker wrapper (public API) | — | GameContainer |
| `mapGenerator.worker.ts` | Worker entry point | — | Vite |
| `tileTextures.ts` | SVG loading, fallback chains, animation | 682 | PixiViewport |
| `tileGlyphs.ts` | Player glyph definition | — | PixiViewport |
| `overlayConfig.ts` | Weighted overlay selection | — | PixiViewport |
| `lighting.ts` | Light sources, flicker cache (FIFO, max 500) | — | gameStore, PixiViewport |
| `tileInteractions.ts` | Triggers, effects, chain reactions | 323 | gameStore |
| `biomes.ts` | Elevation/moisture lookup tables | — | mapGeneratorCore |
| `noise.ts` | Simplex noise, FBM | — | mapGeneratorCore |
| `seedUtils.ts` | URL seed parsing, seeded random (Alea PRNG) | — | GameContainer |
| `i18n.ts` | Localization (enemy, boss, region names) | — | Multiple |
| `enemyTextures.ts` | Enemy/boss texture mapping | — | PixiViewport |
| `colorNoiseCache.ts` | Color noise cache management | — | mapGeneratorCore |

See also: `mapGeneration/AGENTS.md` for phase-based pipeline.

## Web Worker Pattern (CRITICAL)

```
generateMapAsync.ts    →    mapGenerator.worker.ts    →    mapGeneratorCore.ts
     Public API              Worker entry point            Pure function
     Lazy init               Vite ?worker import           56 tests
     Promise interface       Request ID tracking           No side effects
```

**Usage**: `const map = await generateMapAsync(width, height, seed);`

**Never**: Import `mapGeneratorCore` directly in main thread (blocks UI).

## Texture System (682 lines)

**168 SVG imports** organized into:
- `BASE_TILE_URLS` — 43 tiles with fallback chains
- `TRANSITION_URLS` — Water-to-grass edge blending (8 directions)
- `CONNECTED_URLS` — Road/wall 16-state connection
- `OVERLAY_URLS` — 8 overlay types (flowers, grass, pebbles)
- `ANIMATED_TILE_URLS` — 11 animated tiles × 4 frames

**Fallback System** (43 tiles reuse 14 base SVGs):

| Base | Fallback Tiles |
|------|----------------|
| water | shallow_water, deep_water, frozen_water |
| floor | dungeon_floor, trap_*, pressure_plate |
| wall | dungeon_wall, door, door_* |
| swamp | miasma, toxic_marsh, blight |
| grass | cursed_ground, withered_grass |

**To add tile without SVG**: Add to `BASE_TILE_URLS` with existing URL (fallback).

## Overlay Two-Stage Probability

```typescript
// Stage 1: Spawn chance per tile type
OVERLAY_SPAWN_CHANCE = { grass: 0.08, forest: 0.12 }

// Stage 2: Weighted selection (if Stage 1 passes)
OVERLAY_RULES = { grass: [
  { type: 'flowers_1', weight: 3 },
  { type: 'tall_grass', weight: 4 }
]}
```

**8 Overlay Types**: flowers_1, flowers_2, pebbles_1, pebbles_2, leaves, tall_grass, dust_pile, cobweb

## Map Generation Pipeline

Sequential phases (order matters — later overwrites earlier):

```
1. generateBiomeData()      → Noise-based terrain/features
2. runPipeline(ALL_PHASES)  → 12 phases with dependencies
   ├─ river, lakes, roads (no deps)
   ├─ swamps (deps: river, lakes)
   ├─ ruins (deps: roads)
   ├─ graveyards (deps: ruins)
   ├─ blightedAreas, charredAreas (no deps)
   ├─ deadForest (deps: blightedAreas)
   ├─ toxicMarshes (deps: swamps)
   ├─ environmentDetails (deps: charredAreas)
   └─ dungeonEntrance (deps: roads)
```

See `mapGeneration/AGENTS.md` for phase details.

## Biome Lookup Tables

2D grid indexed by elevation (6 bands) × moisture (4 bands):

```
TERRAIN_TABLE[elevation][moisture]:
  Low:   deep_water → water → water → water
  Mid:   sand → grass → grass → swamp
  High:  grass → grass → forest → snow

FEATURE_TABLE: Same structure (NO_FEATURE, hills, forest, mountain)
```

## Tile Interaction System

35+ interactions with triggers and effects:

| Trigger | Examples |
|---------|----------|
| `player_step` | trap_spike → damage, stairs → descend/ascend |
| `fire` | grass → charred_ground + chain fire |
| `water` | fire_trap → extinguish |
| `explosion` | corpse_gas → chain explosion |

**Chain reactions**: Fire spreads to adjacent tiles, explosions cascade.

## Lighting Cache

Flicker calculations cached with FIFO eviction:

```typescript
flickerCache: Map<string, number>  // Max 500 entries
key = quantizedTime (16ms buckets) + position
```

**To add light source**: Add preset to `LIGHT_SOURCE_PRESETS` in `lighting.ts`.

## Seeded Randomness

```typescript
import { seededRandom } from './seedUtils';

const random = seededRandom(12345);  // Alea PRNG
const value = random();              // 0-1
```

**All procedural generation uses seeded randomness for determinism.**

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add game constant | `constants.ts` |
| Add tile texture | `tileTextures.ts` → `BASE_TILE_URLS` or fallback |
| Add animated tile | Create 4 frames + add to `ANIMATED_TILE_URLS` |
| Add overlay type | `overlayConfig.ts` (spawn chance + rules) |
| Add light preset | `lighting.ts` → `LIGHT_SOURCE_PRESETS` |
| Add tile interaction | `tileInteractions.ts` (trigger + effects) |
| Change biome mix | `biomes.ts` → tables |
| Add map feature | `mapGeneratorCore.ts` → add* functions |
| Add generation phase | `mapGeneration/phases/` |

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Import `mapGeneratorCore` in main thread | CPU-intensive, blocks UI |
| Create texture inline in render | Recreates every frame |
| Skip fallback for new tile | 43 tiles work via fallbacks |
| Modify BiomeLayerData outside pipeline | Order-dependent side effects |
| Inline BlurFilter/TextStyle | Use module-level constants |
| Use Math.random() for generation | Use seededRandom for determinism |
