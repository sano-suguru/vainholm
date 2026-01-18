# AGENTS.md - src/stores

**Generated**: 2026-01-18 | **Commit**: 0b652eb | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Central Zustand stores. Hub for game state, meta-progression, floating damage.

## Architecture

| File | Purpose | Lines | Persistence |
|------|---------|-------|-------------|
| `gameStore.ts` | World map, player, visibility, combat, enemies, bosses, weapons, remnant trades | 1238 | No |
| `metaProgressionStore.ts` | Enemy/boss encounters, relics, unlocks, run statistics | 213 | localStorage |
| `damageNumberStore.ts` | Floating damage animation, auto-cleanup | 105 | No |
| `gameStore.progression.test.ts` | Integration tests for stat application | 2 tests | — |

## Store Responsibilities

### gameStore (Hub Store)

Central game state. Most cross-store calls flow through here.

**State Domains**:
- World/dungeon map, terrain/feature layers
- Player position, stats, status effects, weapon
- Visibility (visibleTiles, exploredTiles, visibilityHash)
- Combat state (enemies, currentBoss, turnPhase, combatLog)
- Weather, time of day
- Pending actions (weaponDrop, remnantTrade)
- World↔dungeon cache (worldMapCache, worldExploredTilesCache)

**Key Actions**:
```typescript
setMap(map, seed, spawnAt?)     // Load map data
movePlayer(dx, dy)              // Movement + combat + visibility
cacheWorldMap()                 // Save world before dungeon
restoreWorldMap()               // Restore world after dungeon
addEnemy() / removeEnemy()      // Enemy management
setBoss() / damageBoss()        // Boss management
applyStatModifiers(modifiers)   // From progression system
```

### metaProgressionStore (Persistent)

Cross-run progression. Uses `zustand/middleware/persist`.

**State**:
- `enemyEncounters`: Record of enemy type → first floor, defeat count
- `bossEncounters`: Record of boss type → defeat tracking
- `discoveredRelics`, `equippedRelics`: Relic system (max 2 equipped)
- `unlocks`: Achievement/unlock tracking
- `deepestFloorReached`, `totalRuns`, `totalDeaths`, `totalVictories`

**Key Actions**:
```typescript
recordEnemyEncounter(type, floor, defeated)
recordBossEncounter(type, floor, defeated)
discoverRelic(relicId) / equipRelic(relicId)
recordRunEnd(victory)
resetProgress()                  // Full meta-reset
```

**Storage Key**: `vainholm-meta-progression`

### damageNumberStore (Animation)

Isolated floating damage system with auto-cleanup.

**State**: `damageNumbers: DamageNumber[]`

**Pattern**: Timeout registry for automatic removal (1200ms).

```typescript
addDamageNumber(position, amount, isCritical?, isHeal?)
removeDamageNumber(id)
clearAll()
```

## Cross-Store Communication Pattern

**CRITICAL**: Use `.getState()` for inter-store calls, NOT hooks.

```typescript
// CORRECT: Combat → damage animation
useDamageNumberStore.getState().addDamageNumber(position, damage, isCritical, false);

// CORRECT: Combat → meta-progression
useMetaProgressionStore.getState().recordEnemyEncounter(enemy.type, floor, true);

// WRONG: Hooks in non-React code
const store = useGameStore();  // ❌ Stale closure, outside render cycle
```

**Dependency Flow**:
```
gameStore (hub)
  ├─→ damageNumberStore (addDamageNumber on attack)
  ├─→ metaProgressionStore (recordEnemyEncounter on kill)
  └─← progressionStore (applyStatModifiers on upgrade)
```

## Hook vs getState() Convention

| Context | Pattern | Example |
|---------|---------|---------|
| React component | Hooks + `useShallow` | `useGameStore(useShallow(...))` |
| Combat functions | `.getState()` | `useGameStore.getState().damagePlayer()` |
| Cross-store calls | `.getState()` | `useDamageNumberStore.getState().addDamageNumber()` |
| Tests | `.getState()` + `.setState()` | Direct state manipulation |

## Visibility Hash Optimization

```typescript
// gameStore.ts
visibilityHash: playerX * 10000 + playerY

// Used as React key for FogOfWarLayer
<FogOfWarLayer key={visibilityHash} ... />
```

Forces remount only when player position changes. Prevents unnecessary fog recalculations.

## World ↔ Dungeon Cache

```typescript
// Before entering dungeon
cacheWorldMap()  // Saves map, explored tiles, player position

// After exiting dungeon
restoreWorldMap()  // Returns to dungeon entrance, restores exploration
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add game state | `gameStore.ts` interface + implementation |
| Add meta-progression tracking | `metaProgressionStore.ts` |
| Modify damage animation | `damageNumberStore.ts` |
| Add cross-store communication | Use `.getState()` pattern |
| Test store integration | `gameStore.progression.test.ts` |

## Reset Functions

| Store | Reset Action |
|-------|--------------|
| gameStore | `resetGame()` |
| metaProgressionStore | `resetProgress()` |
| damageNumberStore | `clearAll()` |

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Direct state mutation | Breaks reactivity |
| Hooks in combat/spawner | Stale closures, outside render cycle |
| Circular store deps | Initialization issues |
| Skip `useShallow` for multi-field | Unnecessary re-renders |
| Async in turn execution | Combat is synchronous |
