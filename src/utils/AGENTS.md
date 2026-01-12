# AGENTS.md - src/utils

**Generated**: 2026-01-13 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Utility layer: map generation, rendering data, game systems, configuration.

## File Roles

| File | Purpose | Consumers |
|------|---------|-----------|
| `constants.ts` | TILE_SIZE, MAP_*, VIEWPORT_*, KEY_BINDINGS | 6+ files |
| `mapGeneratorCore.ts` | Procedural generation (pure function) | Worker only |
| `generateMapAsync.ts` | Web Worker wrapper (public API) | GameContainer |
| `mapGenerator.worker.ts` | Worker entry point | Vite |
| `tileTextures.ts` | SVG loading, fallback chains (480 lines) | PixiViewport |
| `tileGlyphs.ts` | Player glyph definition | PixiViewport |
| `overlayConfig.ts` | Weighted overlay selection | PixiViewport |
| `lighting.ts` | Light sources, flicker cache | gameStore, PixiViewport |
| `tileInteractions.ts` | Triggers, effects, chain reactions (323 lines) | gameStore |
| `biomes.ts` | Elevation/moisture lookup tables | mapGeneratorCore |
| `noise.ts` | Simplex noise, FBM | mapGeneratorCore |
| `seedUtils.ts` | URL seed parsing, seeded random | GameContainer |

## Web Worker Pattern (CRITICAL)

```
generateMapAsync.ts    →    mapGenerator.worker.ts    →    mapGeneratorCore.ts
     Public API              Worker entry point            Pure function
     Lazy init                                             No side effects
     Promise interface                                     Testable alone
```

**Usage**: `const map = await generateMapAsync(width, height, seed);`

**Never**: Import `mapGeneratorCore` directly in main thread (blocks UI).

## Texture Fallback System

43 tile types reuse 14 base SVGs:

| Base | Fallback Tiles |
|------|----------------|
| water | shallow_water, deep_water, frozen_water |
| floor | dungeon_floor, trap_*, pressure_plate |
| wall | dungeon_wall, door, door_* |
| swamp | miasma, toxic_marsh, blight |
| grass | cursed_ground, withered_grass |

**To add tile without SVG**: Add to `TILE_FALLBACKS` in `tileTextures.ts`.

## Overlay Two-Stage Probability

```typescript
// Stage 1: Spawn chance per tile type
OVERLAY_SPAWN_CHANCE = { grass: 0.08, forest: 0.12 }

// Stage 2: Weighted selection (if Stage 1 passes)
OVERLAY_RULES = { grass: { flowers_1: 3, tall_grass: 4 } }
```

## Map Generation Pipeline

Sequential phases (order matters — later overwrites earlier):

```
1. generateBiomeData()      → Noise-based terrain/features
2. addRiver()               → Water stripe
3. addLakes()               → Circular water bodies
4. addRoads()               → Cross through center
5. addSwamps()              → Adjacent to water
6. addRuins()               → Scattered floor patches
7. addGraveyards()          → Rectangular zones
8. addBlightedAreas()       → Circular blight
9. addDeadForestPatches()   → Withered trees
10. addToxicMarshes()       → Poison areas
11. addCharredAreas()       → Burned ground
12. addEnvironmentDetails() → Final touches
```

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

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add game constant | `constants.ts` |
| Add tile texture | `tileTextures.ts` → `BASE_TILE_URLS` or fallback |
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
