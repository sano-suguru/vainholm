# AGENTS.md - src/combat

**Generated**: 2026-01-17 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Turn-based combat system. Pure functions called from GameContainer after player action.

## Architecture

| File | Role | Lines |
|------|------|-------|
| `types.ts` | Type definitions (Enemy, Weapon, StatusEffect, CombatStats) | 62 |
| `turnManager.ts` | Turn execution entry point (`executeTurn`) | 30 |
| `enemyAI.ts` | AI behavior: detection, movement, attack | 52 |
| `bossAI.ts` | Boss-specific behavior patterns | — |
| `pathfinding.ts` | Manhattan distance, greedy direction selection | 40 |
| `damageCalculation.ts` | Damage formula, critical hits | — |
| `enemyTypes.ts` | Enemy definitions (skeleton, ghost, cultist) | — |
| `enemySpawner.ts` | Dungeon enemy placement | — |
| `classes.ts` | Character classes (warrior, hunter, scholar) | — |
| `backgrounds.ts` | Character origins (6 types) | — |
| `weapons.ts` | Weapon definitions and patterns | — |
| `weaponAttack.ts` | Weapon attack execution | — |
| `passives.ts` | Passive ability definitions | — |

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
│   - Status effect ticks │
│   - DoT damage          │
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

## Character Classes

| Class | Fixed Ability | Playstyle |
|-------|---------------|-----------|
| **Warrior** | Retaliation | Take hits, counter-attack |
| **Hunter** | Trap Detection | See and avoid/lure traps |
| **Scholar** | Appraisal | Items pre-identified |

## Character Backgrounds

| Background | Effect |
|------------|--------|
| **Fallen Noble** | +1 starting item |
| **Orphan** | Trap damage halved |
| **Ex-Soldier** | +10 starting HP |
| **Apothecary's Apprentice** | +50% healing item effect |
| **Thief's Child** | +1 stealth attack damage |
| **Temple-Raised** | Reduced cost for remnant trades |

## Weapon System (Two-Layer)

**Layer 1: Pattern (Fixed per weapon type)**
| Weapon | Pattern |
|--------|---------|
| Sword | Standard, balanced |
| Axe | 8-directional attack |
| Spear | Line penetration |
| Dagger | High stealth multiplier |
| Club | Knockback |

**Layer 2: Premiums (0-3 random effects)**
| Type | Examples |
|------|----------|
| Stats | HP+, Attack+% |
| Attack | Critical, speed |
| Lifesteal | HP absorption |
| Status | Stun, poison, bleed |
| Element | Fire damage |
| Slayer | Undead bonus |

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

interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
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
| Add character class | `classes.ts` |
| Add background | `backgrounds.ts` |
| Add weapon type | `weapons.ts` |
| Add passive ability | `passives.ts` |

## Boss System

- One boss per region (4 total)
- Spawned via `bossSpawner.ts`
- Boss-specific AI in `bossAI.ts`
- Scaled 1.5x in rendering

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Use hooks in combat functions | Combat runs outside render cycle |
| Async combat logic | Turn system is synchronous |
| Direct state mutation | Use store actions (`updateEnemy`, `damagePlayer`) |
| Complex pathfinding | Keep AI simple, greedy is sufficient |
