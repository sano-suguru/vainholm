# AGENTS.md - src/dungeon/generator

**Generated**: 2026-01-20 | **Commit**: 01d37f0 | **Parent**: [../AGENTS.md](../AGENTS.md)

Core dungeon floor generation engine. BSP algorithm + Union-Find connectivity + tile placement pipeline.

## Architecture

| File | Role | Lines |
|------|------|-------|
| `floorGenerator.ts` | Main pipeline: carving, decorations, traps, hazards, doors, collapse zones | 937 |
| `bspGenerator.ts` | BSP tree generation + Union-Find connectivity + corridor routing | 437 |
| `index.ts` | Public exports (`generateBSP`, `generateFloor`) | 3 |

## BSP Algorithm

See [parent AGENTS.md](../AGENTS.md#bsp-algorithm) for full details. Key exports:

- `generateBSP(width, height, config, random)` → `{ rooms, corridors }`
- `UnionFind` class for connectivity validation
- `createCorridor()` with L-shaped or multi-bend routing

## Floor Generation Pipeline

`generateFloor(options)` executes in order:

1. **BSP generation** → rooms + corridors from `bspGenerator.ts`
2. **Grid carving** → `carveRoom()`, `carveCorridor()`, `carveLine()`
3. **Room type assignment** → entrance, exit, boss, treasure
4. **Feature placement** → decorations, traps, hazards, lights, doors
5. **Collapse zones** → optional destructive terrain (see below)
6. **Stairs placement** → linked to previous floor's stairsDown
7. **MapData construction** → terrain + features layers

## Collapse Zones

Collapse zones create circular void areas within rooms, simulating structural decay.

**Algorithm**:
1. Filter eligible rooms (not entrance/exit/boss, meets min size)
2. Scale `collapseChance` by `regionLevel` if `floorScaling` enabled
3. Pick random position within room (respecting margins)
4. Apply circular collapse with noise-based radius variation
5. Convert floor tiles to `collapse_void`, wall edges to `rubble`
6. Add `cracked_floor` ring around void (configurable radius)
7. **Validate connectivity** — rollback if stairs become unreachable

**Config** (`CollapseConfig`):
- `collapseChance`: Base probability (0.6 for Hróðrgraf)
- `minCollapseSize` / `maxCollapseSize`: Zone dimensions (5-8)
- `maxCollapseZones`: Per floor limit (2)
- `affectWalls`: Whether walls convert to rubble
- `crackedFloorRadius`: Surrounding damage (1)

## WHERE TO LOOK

| Task | File | Function |
|------|------|----------|
| Add floor feature | `floorGenerator.ts` | Create `addXxx()`, call in `generateFloor()` |
| Change room creation | `bspGenerator.ts` | `createRoom()` |
| Modify corridor routing | `bspGenerator.ts` | `createCorridor()` |
| Add shortcut logic | `bspGenerator.ts` | `addShortcutCorridors()` |
| Fix connectivity issues | `bspGenerator.ts` | `ensureConnectivity()`, `UnionFind` |
| Modify collapse behavior | `floorGenerator.ts` | `addCollapseZones()` |
| Change weighted tile selection | `floorGenerator.ts` | `selectWeightedTile()` |

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Skip connectivity validation | Player gets trapped in unreachable areas |
| Collapse without path check | Can block stairs access |
| Hardcode tile IDs | Use `T.tile_name` from registry |
| Modify terrain without backup | Rollback impossible on validation failure |
| Place features before carving | Overwrites floor tiles |
