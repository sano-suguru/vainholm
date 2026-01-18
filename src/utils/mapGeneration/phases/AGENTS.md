# AGENTS.md - src/utils/mapGeneration/phases

**Generated**: 2026-01-18 | **Commit**: b1bdced | **Parent**: [../AGENTS.md](../AGENTS.md)

Individual phase implementations for procedural map generation. See parent for pipeline & phase creation guide.

## Phase List (12 Phases)

| Phase | Depends On | Description |
|-------|------------|-------------|
| `river` | — | Vertical water stripe with random drift (3-width) |
| `lakes` | — | Circular water bodies (3-6 count) |
| `roads` | — | Cross-shaped path network |
| `swamps` | roads | Swamp terrain adjacent to water (30% chance) |
| `ruins` | roads | Floor patches scattered along roads |
| `graveyards` | ruins | Rectangular grave zones |
| `blightedAreas` | — | Circular corruption zones |
| `deadForest` | blightedAreas | Withered trees near blight |
| `toxicMarshes` | swamps | Poison areas near swamps |
| `charredAreas` | — | Burned ground patches |
| `environmentDetails` | charredAreas | Final overlay (bones, rubble, flowers) |
| `dungeonEntrance` | ruins | Stairs_down with constraint-based fallback |

## Common Patterns

```typescript
const T = TILE_ID_BY_TYPE;  // Always alias at top
const NO_FEATURE = 0;       // Always define

export function myPhase(ctx: PlacementContext, mutator: PlacementMutator): PhaseResult {
  const upstream = ctx.getMetadata<T>('key');  // Read from dependency
  mutator.setTerrain(x, y, T.tile);            // Mutate via mutator only
  mutator.setMetadata('myPhase.result', data); // Pass to downstream
  return { success: true };
}
export const MY_PHASE = { name: 'myPhase', dependsOn: ['dep'], execute: myPhase };
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Water features | `river.ts`, `lakes.ts` |
| Path/structure generation | `roads.ts`, `ruins.ts`, `graveyards.ts` |
| Environmental hazards | `swamps.ts`, `toxicMarshes.ts`, `blightedAreas.ts` |
| Constraint-based placement | `dungeonEntrance.ts` (best example) |
| Register new phase | `index.ts` → add to `ALL_PHASES` |

## Anti-Patterns

| Forbidden | Correct |
|-----------|---------|
| Missing `dependsOn: []` | Always declare (empty array OK) |
| Direct `layers.terrain[y][x]` | Use `mutator.setTerrain()` |
| `Math.random()` | Use `ctx.random()` |
