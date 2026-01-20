# AGENTS.md - src/dungeon

**Generated**: 2026-01-20 | **Commit**: 01d37f0 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Dungeon generation system. Procedural floors with BSP algorithm, separate Zustand store.

## Architecture

| File | Role | Lines |
|------|------|-------|
| `dungeonStore.ts` | Zustand store: dungeon state, floor navigation | 165 |
| `types.ts` | Type definitions (Dungeon, Floor, Room, Corridor, BSPNode, RegionConfig) | — |
| `bossSpawner.ts` | Boss placement logic per region | — |
| `testUtils.ts` | Test helpers (floodFill, isReachable, mapToAscii) | — |
| `generator/index.ts` | Floor generation orchestrator | — |
| `generator/floorGenerator.ts` | Floor layout + tile placement | 937 |
| `generator/bspGenerator.ts` | BSP algorithm + Union-Find connectivity | 437 |
| `config/index.ts` | Region config lookup | — |
| `config/hrodrgraf.ts` | Region 1: Hróðrgraf (栄光の墓) | 77 |
| `config/rotmyrkr.ts` | Region 2: Rótmyrkr (根の闇) | 77 |
| `config/gleymdariki.ts` | Region 3: Gleymdaríki (忘却の王国) | — |
| `config/upphafsdjup.ts` | Region 4: Upphafsdjúp (起源の深淵) | — |

## Dungeon Structure

```
Dungeon
├── regions: RegionConfig[]      # 4 regions, 8 floors (normal) / 16 floors (advanced)
├── floors: Map<number, Floor>   # Lazy-generated per floor
├── currentFloor: number         # Active floor index
├── baseSeed: number             # Deterministic generation
└── deepestReached: number       # Progress tracking
```

**Floor generation**: On-demand when player descends/ascends. Seed = `baseSeed + level * 1000`.

## Regions (from GAME_DESIGN.md)

| Region | Name | Floors (Normal/Advanced) | Theme | Base Size |
|--------|------|--------------------------|-------|-----------|
| Hróðrgraf | 栄光の墓 | 1-2 / 1-4 | Temple ruins | 40x40 |
| Rótmyrkr | 根の闇 | 3-4 / 5-8 | Corrupted roots | 45x45 |
| Gleymdaríki | 忘却の王国 | 5-6 / 9-12 | Gothic fortress | — |
| Upphafsdjúp | 起源の深淵 | 7-8 / 13-16 | Primordial void | — |

## RegionConfig Interface

```typescript
interface RegionConfig {
  theme: DungeonTheme;
  name: string;
  displayName: string;           // Japanese name
  floors: number;
  startFloor: number;
  generatorStyle: 'bsp' | 'cellular' | 'hybrid';
  size: FloorSizeConfig;
  bspConfig: BSPConfig;
  decorationConfig?: DecorationConfig;
  trapConfig?: TrapConfig;
  lightingConfig?: LightingConfig;
  hazardConfig?: HazardConfig;
  doorConfig?: DoorConfig;
  multiTileConfig?: MultiTileConfig;
  collapseConfig?: CollapseConfig;
}
```

## BSP Algorithm

**Binary Space Partition** for room generation:

```
1. Start with full floor as root node
2. Recursively split nodes (horizontal/vertical)
3. Stop when node can't fit minRoomSize
4. Create room in each leaf node
5. Connect sibling rooms with corridors (L-shaped or multi-bend)
6. Validate connectivity (Union-Find)
7. Add corridors for isolated components
8. Optional shortcuts for distant rooms
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
5. Carve corridors (L-shaped with optional extra bends)
6. Place decorations (pillar, rubble, bone_pile, etc.)
7. Place traps (web, pit, spike)
8. Place hazards (toxic_marsh, miasma, blight)
9. Place lights (brazier, wall_torch)
10. Place doors (regular, locked, secret)
11. Place stairsUp (linked to previous floor's stairsDown)
12. Place stairsDown (random room, not entrance)
13. Generate MapData
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

## Region-Specific Features

**Hróðrgraf (Region 1)**:
- Decorations: pillar (0.25), rubble (0.25), bone_pile (0.20), sarcophagus (0.15), altar_dark (0.10)
- Lighting: 15% chance, brazier (0.4), wall_torch (0.6)
- Doors: 50% chance, 20% locked, 10% secret
- Collapse: 60% chance, 5-8 size, max 2 zones

**Rótmyrkr (Region 2)**:
- Traps: 40% chance, 2 per room, web (0.40), pit (0.30), spike (0.30)
- Hazards: 50% chance, toxic_marsh (0.40), miasma (0.30), blight (0.30)
- Shortcuts: 20 max distance, 40% chance, max 3
- Extra corridor bends: 40% chance, max 2 per corridor

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add region | `config/` + add to `REGION_CONFIGS` in `config/index.ts` |
| Modify BSP params | Region config → `bspConfig` |
| Change floor size | Region config → `size.base` or `size.perFloor` |
| Modify room generation | `generator/bspGenerator.ts` |
| Modify floor tiles | `generator/floorGenerator.ts` |
| Add floor feature | `generator/floorGenerator.ts` |
| Add decoration type | Region config → `decorationConfig.decorationTiles` |
| Add trap type | Region config → `trapConfig.trapTypes` |
| Debug connectivity | Use `testUtils.ts` → `floodFill`, `mapToAscii` |

## Testing

19 tests in `generator/floorGenerator.test.ts`:
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
  regionLevel: number;
  theme: DungeonTheme;
  map: MapData;
  stairsUp: Position | null;
  stairsDown: Position | null;
  rooms: Room[];
  corridors: Corridor[];
  multiTileObjects: MultiTileObject[];
  visited: boolean;
  seed: number;
}

interface Room {
  id: number;
  x, y, width, height: number;
  center: Position;
  roomType?: 'entrance' | 'exit' | 'boss' | 'treasure';
}

interface Corridor {
  start: Position;
  end: Position;
  width: number;
  bend?: Position;      // Single L-bend
  bends?: Position[];   // Multiple waypoints
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

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Direct Map mutation | Use dungeonStore actions |
| Skip stairs linking | Breaks floor-to-floor navigation |
| Ignore connectivity validation | Player could be trapped |
| Hardcode region floors | Use REGION_CONFIGS lookup |
