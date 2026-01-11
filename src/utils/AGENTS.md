# AGENTS.md - src/utils

Utility layer for Vainholm. 13 specialized modules with cross-cutting concerns.

## Overview

| Category | Files | Purpose |
|----------|-------|---------|
| Map Generation | 4 | Procedural maps via Web Worker |
| Rendering Data | 3 | Textures, glyphs, overlays |
| Game Systems | 2 | Lighting, tile interactions |
| Configuration | 4 | Constants, seeds, biomes, noise |

## File Roles

| File | Purpose | Main Consumers |
|------|---------|----------------|
| `constants.ts` | TILE_SIZE, MAP_*, VIEWPORT_*, KEY_BINDINGS | 6+ files (most used) |
| `mapGeneratorCore.ts` | Procedural generation algorithm | Worker only |
| `generateMapAsync.ts` | Web Worker wrapper (public API) | GameContainer |
| `mapGenerator.worker.ts` | Worker entry point | Vite |
| `seedUtils.ts` | URL seed parsing, seeded random | GameContainer |
| `noise.ts` | Simplex noise, FBM | mapGeneratorCore |
| `biomes.ts` | Elevation/moisture lookup tables | mapGeneratorCore |
| `tileTextures.ts` | SVG loading, fallback chains | PixiViewport |
| `tileGlyphs.ts` | Glow configs, animation timing | PixiViewport |
| `overlayConfig.ts` | Weighted overlay selection | PixiViewport |
| `lighting.ts` | Light sources, flicker cache | gameStore, PixiViewport |
| `tileInteractions.ts` | Triggers, effects, chain reactions | gameStore |
| `colorNoiseCache.ts` | Reserved (empty) | - |

## Web Worker Pattern (CRITICAL)

Map generation runs in Web Worker to prevent UI blocking.

```
Public API                   Worker Entry              Core Logic
generateMapAsync.ts    →    mapGenerator.worker.ts    →    mapGeneratorCore.ts
     ↓                                                            ↓
Lazy worker init                                            Pure function
Request ID queue                                            No side effects
Promise interface                                           Testable alone
```

**Usage**:
```typescript
import { generateMapAsync } from '../utils/generateMapAsync';
const map = await generateMapAsync(width, height, seed);
```

**Never**: Import `mapGeneratorCore` directly in main thread.

## Texture Fallback System

43 tile types reuse 14 base SVGs via fallback chain:

| Base Texture | Fallback Tiles |
|--------------|----------------|
| `water` | shallow_water, deep_water, frozen_water |
| `floor` | dungeon_floor, trap_*, pressure_plate |
| `wall` | dungeon_wall, door, door_* |
| `swamp` | miasma, toxic_marsh, blight |
| `grass` | cursed_ground, withered_grass |

**To add tile without SVG**: Add fallback mapping in `TILE_FALLBACKS`.

## Overlay Two-Stage Probability

```typescript
// Stage 1: Spawn chance per tile type
OVERLAY_SPAWN_CHANCE = { grass: 0.08, forest: 0.12 }

// Stage 2: Weighted selection (only if Stage 1 passes)
OVERLAY_RULES = { grass: { flowers_1: 3, tall_grass: 4 } }
```

Both stages must pass for overlay to render.

## Biome Lookup Tables

2D grid indexed by elevation (6 bands) × moisture (4 bands):

```
TERRAIN_TABLE[elevation][moisture]:
  Low elev:  deep_water → water → water → water
  Mid elev:  sand → grass → grass → swamp
  High elev: grass → grass → forest → snow

FEATURE_TABLE: Same structure for features (NO_FEATURE, hills, forest, mountain)
```

**To change biome distribution**: Modify `BIOME_THRESHOLDS` or table contents.

## Lighting Cache

Flicker calculations are expensive. Cache with FIFO eviction:

```typescript
// Quantized time (16ms buckets) + position → cached flicker value
flickerCache: Map<string, number>  // Max 500 entries, FIFO eviction
```

**To add light source type**: Add preset to `LIGHT_SOURCE_PRESETS`.

## Glyph Animation Phase Offset

Tiles animate with position-based phase offset to prevent sync artifacts:

```typescript
phaseOffset = (x + y * 3) * (frameInterval / 2)
```

Creates wave effect across map instead of uniform pulsing.

## Map Generation Pipeline

Sequential modification functions (order matters):

```
1. generateBiomeData() → base terrain/features from noise
2. addRiver() → water stripe
3. addLakes() → circular water bodies
4. addRoads() → cross through center
5. addSwamps() → adjacent to water
6. addRuins() → scattered floor patches
7. addGraveyards() → rectangular zones
8. addBlightedAreas() → circular blight
9. addDeadForestPatches()
10. addToxicMarshes()
11. addCharredAreas()
12. addEnvironmentDetails() → final touches
```

Later functions overwrite earlier. Check order when adding features.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add game constant | `constants.ts` | Centralized config |
| Add tile texture | `tileTextures.ts` → `BASE_TILE_URLS` | Or add fallback |
| Add tile glow | `tileGlyphs.ts` → `TILE_GLYPHS` | Include animation frames |
| Add overlay type | `overlayConfig.ts` | Both spawn chance + rules |
| Add light preset | `lighting.ts` → `LIGHT_SOURCE_PRESETS` | Flicker params |
| Add tile interaction | `tileInteractions.ts` | Trigger + effects |
| Change biome mix | `biomes.ts` → tables | Terrain/feature tables |
| Change map feature | `mapGeneratorCore.ts` | Add* functions |

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Import `mapGeneratorCore` in main thread | CPU-intensive, blocks UI |
| Create texture inline in render | Recreates every frame |
| Skip fallback for new tile | 43 tiles work via fallbacks |
| Modify `BiomeLayerData` outside pipeline | Order-dependent side effects |
