# AGENTS.md - src/dungeon

**Generated**: 2026-01-13 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Dungeon generation system. Procedural floors with BSP algorithm, separate Zustand store.

## Architecture

| File | Role |
|------|------|
| `dungeonStore.ts` | Zustand store: dungeon state, floor navigation |
| `types.ts` | Type definitions (Dungeon, Floor, Room, Corridor, BSPNode) |
| `generator/index.ts` | Floor generation orchestrator |
| `generator/floorGenerator.ts` | Floor layout + tile placement |
| `generator/bspGenerator.ts` | BSP algorithm + Union-Find connectivity (355 lines) |
| `config/index.ts` | Region config lookup |
| `config/hrodrgraf.ts` | First region: "Glory's Tomb" (3 floors) |
| `testUtils.ts` | Test helpers (floodFill, isReachable, mapToAscii) |

## Dungeon Structure

```
Dungeon
├── regions: RegionConfig[]      # 4 regions, 16 total floors
├── floors: Map<number, Floor>   # Lazy-generated per floor
├── currentFloor: number         # Active floor index
├── baseSeed: number             # Deterministic generation
└── deepestReached: number       # Progress tracking
```

**Floor generation**: On-demand when player descends/ascends. Seed = `baseSeed + level * 1000`.

## Regions (from GAME_DESIGN.md)

| Region | Name | Floors | Theme |
|--------|------|--------|-------|
| Hróðrgraf | 栄光の墓 | 1-3 | Temple ruins |
| Rótmyrkr | 根の闇 | 4-8 | Corrupted roots |
| Gleymdaríki | 忘却の王国 | 9-13 | Gothic fortress |
| Upphafsdjúp | 起源の深淵 | 14-16 | Primordial void |

## BSP Algorithm

**Binary Space Partition** for room generation:

```
1. Start with full floor as root node
2. Recursively split nodes (horizontal/vertical)
3. Stop when node can't fit minRoomSize
4. Create room in each leaf node
5. Connect sibling rooms with corridors
6. Validate connectivity (Union-Find)
7. Add corridors for isolated components
```

**Config** (`BSPConfig`):
- `minRoomSize`: 5 | `maxRoomSize`: 10
- `minRooms`: 6 | `maxRooms`: 10
- `corridorWidth`: 2 | `roomMargin`: 1

## Floor Generation Pipeline

```
1. BSP generation → rooms + corridors
2. Place floor tiles
3. Place wall tiles (border + fill)
4. Carve rooms
5. Carve corridors (L-shaped)
6. Place stairsUp (linked to previous floor's stairsDown)
7. Place stairsDown (random room, not entrance)
8. Generate MapData
```

## Store Actions

| Action | Description |
|--------|-------------|
| `enterDungeon(seed)` | Initialize dungeon, generate floor 1 |
| `exitDungeon()` | Clear dungeon state |
| `goToFloor(level)` | Navigate to floor (lazy generation) |
| `descendStairs()` | Go to `currentFloor + 1` |
| `ascendStairs()` | Go to `currentFloor - 1` |
| `getCurrentFloor()` | Get active DungeonFloor |
| `getCurrentRegion()` | Get active RegionConfig |

## Stairs Linking

```typescript
// Previous floor's stairsDown position → current floor's stairsUp position
const floor = generateFloor({
  previousStairsDown: dungeon.floors.get(level - 1)?.stairsDown,
  // ...
});
```

Ensures vertical alignment between floors.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add region | `config/` + add to `REGION_CONFIGS` |
| Modify BSP params | Region config → `bspConfig` |
| Change floor size | Region config → `size.base` or `size.perFloor` |
| Modify room generation | `generator/bspGenerator.ts` |
| Modify floor tiles | `generator/floorGenerator.ts` |
| Add floor feature | `generator/floorGenerator.ts` |
| Debug connectivity | Use `testUtils.ts` → `floodFill`, `mapToAscii` |

## Testing

5 tests in `generator/floorGenerator.test.ts`:
- Floor generation with spawn/stairs
- Spawn point reachability
- Walkable tile connectivity
- Multi-seed determinism
- Corridor connectivity

```bash
pnpm test src/dungeon
```

## Type Definitions

```typescript
interface DungeonFloor {
  level: number;
  theme: DungeonTheme;
  map: MapData;
  stairsUp: Position | null;
  stairsDown: Position | null;
  rooms: Room[];
  corridors: Corridor[];
}

interface Room {
  id: number;
  x, y, width, height: number;
  center: Position;
  roomType?: 'entrance' | 'exit' | 'boss' | 'treasure';
}
```

## Dual Store Pattern

**gameStore**: World map state, player, visibility
**dungeonStore**: Dungeon-specific state, floor navigation

Transition flow:
```
World → enterDungeon() → gameStore.cacheWorldMap()
Dungeon → exitDungeon() → gameStore.restoreWorldMap()
```
