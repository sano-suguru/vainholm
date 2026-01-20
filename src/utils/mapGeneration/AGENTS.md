# AGENTS.md - src/utils/mapGeneration

**Generated**: 2026-01-20 | **Commit**: 35f9005 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Phase-based procedural generation pipeline. Topological sort ensures dependency order.

## Architecture

| File | Role | Lines |
|------|------|-------|
| `types.ts` | Core interfaces (PlacementContext, PlacementMutator, GenerationPhase) | — |
| `pipeline.ts` | Pipeline runner with topological sort (Kahn's algorithm) | 109 |
| `PlacementContext.ts` | Read-only access to terrain/features + metadata | 98 |
| `PlacementMutator.ts` | Write operations for terrain/features | 42 |
| `constraints.ts` | Reusable placement constraints | 152 |
| `phases/index.ts` | Barrel export of all 12 phases | — |

## Pipeline Flow

```
generateMapData() [mapGeneratorCore.ts]
    ↓
generateBiomeData()  →  terrain[][] + features[][]
    ↓
runPipeline(ALL_PHASES, layers, width, height, random)
    ↓
topologicalSort(phases)  →  dependency-ordered execution (Kahn's algorithm)
    ↓
For each phase:
    phase.execute(ctx, mutator)
    ↓
    Merge metadata → ctx.setMetadataInternal()
    ↓
    If failed → return early
    ↓
Final result with merged metadata
```

## Phase Execution Order

Phases declare dependencies via `dependsOn: string[]`. Topological sort resolves order:

| Phase | Depends On | Effect |
|-------|------------|--------|
| `river` | [] | Vertical water stripe with drift (3-width) |
| `lakes` | [] | Circular water bodies (3-6 count) |
| `roads` | [] | Cross-shaped path network |
| `swamps` | ['river', 'lakes'] | Adjacent to water |
| `ruins` | ['roads'] | Scattered floor patches on roads |
| `graveyards` | ['ruins'] | Rectangular zones |
| `blightedAreas` | [] | Circular blight zones |
| `deadForest` | ['blightedAreas'] | Withered trees near blight |
| `toxicMarshes` | ['swamps'] | Poison areas near swamps |
| `charredAreas` | [] | Burned ground |
| `environmentDetails` | ['charredAreas'] | Final overlay pass (bone piles, rubble, flowers) |
| `dungeonEntrance` | ['roads'] | Stairs_down placement with constraints |

## Core Interfaces

```typescript
interface PlacementContext {
  readonly width: number;
  readonly height: number;
  readonly random: () => number;
  
  isInBounds(x: number, y: number): boolean;
  getTerrain(x: number, y: number): TileId;
  getFeature(x: number, y: number): TileId;
  findValidPosition(constraints, searchArea?, maxAttempts?): PlacementResult;
  canPlace(x: number, y: number, constraints): boolean;
  getMetadata<T>(key: string): T | undefined;
}

interface PlacementMutator {
  setTerrain(x: number, y: number, tile: TileId): void;
  setFeature(x: number, y: number, tile: TileId): void;
  clearFeature(x: number, y: number): void;
  setMetadata(key: string, value: unknown): void;
}

interface GenerationPhase {
  name: string;
  dependsOn: string[];
  execute: PhaseExecutor;
}
```

## Constraints System (152 lines)

Factory functions returning `NamedConstraint` objects:

| Category | Constraints |
|----------|-------------|
| **Terrain** | `terrainIs()`, `terrainNot()`, `walkableTerrain()` |
| **Feature** | `featureEmpty()`, `featureIs()`, `featureNot()` |
| **Area** | `areaWalkable(radius)`, `areaTerrainWalkable(radius)` |
| **Spatial** | `awayFrom(positions[], minDistance)`, `nearTo(position, maxDistance)` |
| **Probability** | `probability(chance, random)` |
| **Bounds** | `inBounds(margin)` |

## Creating a New Phase

```typescript
// phases/myPhase.ts
import type { GenerationPhase, PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE as T } from '../../../tiles';
import { Constraints } from '../constraints';

const NO_FEATURE = 0;

function myPhaseExecute(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  // 1. Find valid position
  const result = ctx.findValidPosition([
    Constraints.walkable(),
    Constraints.inBounds(10),
    Constraints.awayFrom([existingPositions], 5)
  ]);
  
  if (!result.valid) {
    return { success: false, reason: result.reason };
  }
  
  // 2. Mutate terrain/features
  mutator.setTerrain(result.position.x, result.position.y, T.my_tile);
  
  // 3. Store metadata for downstream phases
  mutator.setMetadata('myPhase.position', result.position);
  
  return { success: true, metadata: { myKey: 'value' } };
}

export const MY_PHASE: GenerationPhase = {
  name: 'myPhase',
  dependsOn: ['roads'],  // Runs after roads phase
  execute: myPhaseExecute,
};
```

Then add to `phases/index.ts`:
```typescript
import { MY_PHASE } from './myPhase';
export const ALL_PHASES: GenerationPhase[] = [
  // ... existing phases
  MY_PHASE,
];
```

## Phase Naming Convention

| Entity | Convention | Example |
|--------|------------|---------|
| Function | camelCase + "Phase" | `riverPhase`, `lakesPhase` |
| Export | SCREAMING_SNAKE + "_PHASE" | `RIVER_PHASE`, `LAKES_PHASE` |
| Tile shorthand | `const T = TILE_ID_BY_TYPE` | Always define |
| No feature | `const NO_FEATURE = 0` | Always define |

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add generation phase | `phases/` → new file + add to `index.ts` |
| Add placement constraint | `constraints.ts` |
| Modify pipeline execution | `pipeline.ts` → `runPipeline` |
| Access phase metadata | `ctx.getMetadata<T>(key)` |
| Debug phase failure | Check `PhaseResult.reason` |
| Read terrain data | `ctx.getTerrain(x, y)` |
| Write terrain data | `mutator.setTerrain(x, y, tileId)` |

## Tile ID Pattern

```typescript
import { TILE_ID_BY_TYPE as T } from '../../../tiles';

// Use shorthand in all phases
layers.terrain[y][x] = T.water;
layers.features[y][x] = T.forest;
const NO_FEATURE = 0;
```

## Constraint Composition

```typescript
// Multiple constraints ANDed together
ctx.findValidPosition([
  Constraints.walkable(),
  Constraints.awayFrom([existingPosition], 5),
  Constraints.inBounds(10),
  Constraints.probability(0.3, ctx.random)
]);
```

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Direct terrain[][] access in phase | Use ctx.getTerrain() |
| Modify terrain without mutator | Breaks metadata tracking |
| Circular dependencies | Topological sort fails (returns null) |
| Skip success check | Pipeline continues on failure |
| Use random() directly | Use ctx.random for determinism |
| Missing `dependsOn` array | Phase may run in wrong order |
