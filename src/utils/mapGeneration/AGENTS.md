# AGENTS.md - src/utils/mapGeneration

**Generated**: 2026-01-16 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Phase-based procedural generation pipeline. Topological sort ensures dependency order.

## Architecture

| File | Role |
|------|------|
| `types.ts` | Core interfaces (PlacementContext, PlacementMutator, GenerationPhase) |
| `pipeline.ts` | Pipeline runner with topological sort |
| `PlacementContext.ts` | Read-only access to terrain/features |
| `PlacementMutator.ts` | Write operations for terrain/features |
| `constraints.ts` | Reusable placement constraints |
| `phases/index.ts` | Barrel export of all 12 phases |

## Pipeline Flow

```
generateMapData() [mapGeneratorCore.ts]
    ↓
generateBiomeData()  →  terrain[][] + features[][]
    ↓
runPipeline(ALL_PHASES, layers, width, height, random)
    ↓
topologicalSort(phases)  →  dependency-ordered execution
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
| `river` | [] | Water stripe across map |
| `lakes` | [] | Circular water bodies |
| `roads` | [] | Cross-shaped path |
| `swamps` | ['river', 'lakes'] | Adjacent to water |
| `ruins` | ['roads'] | Scattered floor patches |
| `graveyards` | ['roads'] | Rectangular zones |
| `blightedAreas` | [] | Circular blight |
| `deadForest` | ['blightedAreas'] | Withered trees near blight |
| `toxicMarshes` | ['swamps'] | Poison areas near swamps |
| `charredAreas` | [] | Burned ground |
| `environmentDetails` | ['*'] | Final overlay pass |
| `dungeonEntrance` | ['roads'] | Stairs_down placement |

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

## Creating a New Phase

```typescript
// phases/myPhase.ts
import type { GenerationPhase } from '../types';
import { isWalkable } from '../constraints';

export const MY_PHASE: GenerationPhase = {
  name: 'myPhase',
  dependsOn: ['roads'],  // Runs after roads phase
  execute: (ctx, mutator) => {
    // 1. Find valid position
    const result = ctx.findValidPosition([isWalkable]);
    if (!result.valid) {
      return { success: false, reason: 'No valid position' };
    }
    
    // 2. Mutate terrain/features
    mutator.setTerrain(result.position.x, result.position.y, 'my_tile');
    
    // 3. Store metadata for downstream phases
    mutator.setMetadata('myPhase.position', result.position);
    
    return { success: true, metadata: { myKey: 'value' } };
  },
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

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add generation phase | `phases/` → new file + add to `index.ts` |
| Add placement constraint | `constraints.ts` |
| Modify pipeline execution | `pipeline.ts` → `runPipeline` |
| Access phase metadata | `ctx.getMetadata<T>(key)` |
| Debug phase failure | Check `PhaseResult.reason` |

## Constraints

Reusable constraint functions in `constraints.ts`:

```typescript
isWalkable     // Terrain allows movement
isNotWater     // Not water/deep_water
isNearWater    // Adjacent to water tile
isOnGrass      // Terrain is grass
hasNoFeature   // No feature at position
```

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Direct terrain[][] access in phase | Use ctx.getTerrain() |
| Modify terrain without mutator | Breaks metadata tracking |
| Circular dependencies | Topological sort fails (returns null) |
| Skip success check | Pipeline continues on failure |
