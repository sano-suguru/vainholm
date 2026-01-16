# AGENTS.md - src/combat

**Generated**: 2026-01-16 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Turn-based combat system. Pure functions called from GameContainer after player action.

## Architecture

| File | Role | Lines |
|------|------|-------|
| `types.ts` | Type definitions (Enemy, Weapon, StatusEffect, CombatStats) | 62 |
| `turnManager.ts` | Turn execution entry point (`executeTurn`) | 30 |
| `enemyAI.ts` | AI behavior: detection, movement, attack | 52 |
| `pathfinding.ts` | Manhattan distance, greedy direction selection | 40 |
| `damageCalculation.ts` | Damage formula, critical hits | - |
| `enemyTypes.ts` | Enemy definitions (skeleton, ghost, cultist) | - |
| `enemySpawner.ts` | Dungeon enemy placement | - |

## Turn Flow

```
Player action (movePlayer)
    ↓
executeTurn()
    ↓
┌─────────────────────────┐
│ Phase: 'enemy'          │
│   processAllEnemies()   │
│   - Detection (range)   │
│   - Attack (adjacent)   │
│   - Move (toward player)│
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Phase: 'effects'        │
│   processEffects()      │
│   (status effects)      │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Phase: 'player'         │
│   incrementTick()       │
│   (await next input)    │
└─────────────────────────┘
```

## Enemy AI Pattern

```typescript
processEnemyAI(enemy):
  1. Skip if dead
  2. Check detection range (Manhattan distance)
  3. If adjacent → attack player (damage = attack - defense, min 1)
  4. Else → move toward player (greedy, avoid occupied tiles)
```

**Pathfinding**: Simple greedy — picks direction that minimizes distance. Not A*.

## Type System

```typescript
interface Enemy {
  id: EnemyId;
  type: EnemyTypeId;            // 'skeleton' | 'ghost' | 'cultist'
  position: Position;
  stats: CombatStats;           // hp, maxHp, attack, defense
  isAlive: boolean;
  statusEffects?: Map<StatusEffectId, StatusEffect>;
}

type TurnPhase = 'player' | 'enemy' | 'effects';
type GameEndState = 'playing' | 'victory' | 'defeat';
```

## Store Integration

Combat uses `useGameStore.getState()` (not hooks) for direct state access:

```typescript
const store = useGameStore.getState();
const { player, canMoveTo, getEnemyAt, updateEnemy, damagePlayer } = store;
```

**Why**: Combat runs outside React render cycle, called synchronously after player move.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add enemy type | `enemyTypes.ts` → `ENEMY_TYPES` |
| Change AI behavior | `enemyAI.ts` → `processEnemyAI` |
| Modify damage formula | `damageCalculation.ts` |
| Add status effect | `types.ts` → `StatusEffectId`, then `turnManager.ts` → `processEffects` |
| Change spawning rules | `enemySpawner.ts` |
| Add combat log entry | Use `addCombatLogEntry()` from store |

## Pending TODOs

`stores/gameStore.ts` line 18:
```typescript
// TODO: クラス/武器/状態異常システム実装時に以下を追加
// classId: CharacterClassId
// weapon: Weapon | null
// statusEffects: Map<StatusEffectId, StatusEffect>
```

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Use hooks in combat functions | Combat runs outside render cycle |
| Async combat logic | Turn system is synchronous |
| Direct state mutation | Use store actions (`updateEnemy`, `damagePlayer`) |
