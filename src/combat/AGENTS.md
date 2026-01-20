# AGENTS.md - src/combat

**Generated**: 2026-01-20 | **Commit**: 01d37f0 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

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
│ Phase: 'ally'           │
│   processAllAllies()    │
│   - Attack adjacent     │
│   - Move (mode-based)   │
└─────────────────────────┘
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

type TurnPhase = 'player' | 'ally' | 'enemy' | 'effects';
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

## Cross-Store Dependencies

```typescript
// enemySpawner.ts
const store = useGameStore.getState();
const dungeonStore = useDungeonStore.getState();

// bossSpawner.ts
useGameStore.getState().setBoss(boss);
```

## COMPLETE EXAMPLE: Adding a New Enemy Type

This section shows the complete process of adding a new enemy called "Shadow Beast" (影獣).

### Step 1: Add Type Definition to `types.ts`

```typescript
// Add to EnemyTypeId union type
export type EnemyTypeId =
  | 'skeleton'
  | 'ghost'
  | 'cultist'
  | 'wraith'
  | 'crawler'
  | 'shade'
  | 'hollow_knight'
  | 'blight_spawn'
  | 'void_worm'
  | 'shadow_beast';  // ← Add this line
```

### Step 2: Add Enemy Definition to `enemyTypes.ts`

```typescript
export const ENEMY_TYPES: Record<EnemyTypeId, EnemyTypeDefinition> = {
  // ... existing enemies ...
  
  shadow_beast: {
    id: 'shadow_beast',
    name: 'Shadow Beast',
    displayName: '影獣',
    baseStats: {
      hp: 22,       // Mid-tier HP
      maxHp: 22,
      attack: 9,    // High attack
      defense: 1,   // Low defense (glass cannon)
    },
    detectionRange: 9,  // High awareness
    moveSpeed: 1,
    regions: ['rotmyrkr', 'gleymdariki'],  // Appears in regions 2-3
    floorMin: 4,        // Mid-game enemy
    floorMax: 6,
    spawnWeight: 0.8,   // Slightly rare (1.0 = standard)
  },
};
```

**Design Rationale**:
- **Glass cannon archetype**: High attack, low defense creates meaningful choice (engage vs. avoid)
- **Floor 4-6**: Mid-game timing ensures player has defensive options
- **Multiple regions**: Increases encounter variety across different dungeon areas
- **spawnWeight 0.8**: Slightly rarer than standard (1.0) to maintain threat perception

### Step 3: Add Localization Entries

**File: `/messages/en.json`**
```json
{
  "enemy_shadow_beast": "Shadow Beast"
}
```

**File: `/messages/ja.json`**
```json
{
  "enemy_shadow_beast": "影獣"
}
```

**After editing JSON files, run**:
```bash
pnpm run compile-i18n  # Regenerates paraglide messages
```

### Step 4: Manual Testing Checklist

| Test | How | Expected Result |
|------|-----|----------------|
| **Spawning** | 1. Start new game<br>2. Enter dungeon (Rotmyrkr/Gleymdariki)<br>3. Reach floor 4-6 | Shadow Beast spawns on floor |
| **Detection** | Move within 9 tiles of enemy | Enemy moves toward player |
| **Combat** | Attack enemy | Damage calculated: `max(1, player_attack - 1)` |
| **Damage Taken** | Let enemy attack | Player takes: `max(1, 9 - player_defense)` |
| **Death** | Reduce enemy HP to 0 | Enemy disappears, combat log shows kill |
| **Localization** | Switch language (F9) | Name displays correctly in both languages |
| **Floor Restriction** | Check floors 1-3 and 7-8 | Shadow Beast does NOT spawn outside floor 4-6 |
| **Region Restriction** | Visit Hrodrgraf (region 1) | Shadow Beast does NOT spawn in region 1 |

### Step 5: Verify Type Safety

```bash
pnpm build  # Must pass without errors
```

Common type errors:
- ❌ `Property 'shadow_beast' is missing` → Forgot to add to `ENEMY_TYPES` record
- ❌ `Type '"shadow_beast"' is not assignable` → Forgot to add to `EnemyTypeId` union

### Why This Works

**1. Transparency (Brogue Principle)**:
- Stats visible in combat log → Player learns enemy strength through observation
- Detection range consistent → Predictable behavior

**2. Meaningful Choice (Brogue Principle)**:
- Glass cannon stats → "Do I engage now or prepare more?" is a real decision
- Not universal → Limited region/floor range creates strategic planning

**3. Scarcity (Brogue Principle)**:
- spawnWeight 0.8 → Slightly rare, maintains threat perception
- Mid-game only → Doesn't dilute early-game learning curve

**4. Emergent Interaction**:
- High attack interacts with: armor upgrades, defensive passives, healing items
- High detection range interacts with: stealth mechanics, positioning, trap usage

### Common Mistakes to Avoid

| ❌ BAD | ✅ GOOD | Why |
|--------|---------|-----|
| `hp: 1000, attack: 50` | `hp: 22, attack: 9` | Extreme stats break balance formula `max(1, atk - def)` |
| `floorMin: 1, floorMax: 8` | `floorMin: 4, floorMax: 6` | Universal availability removes strategic planning |
| `spawnWeight: 10.0` | `spawnWeight: 0.8` | Too common → dilutes enemy variety |
| `detectionRange: 99` | `detectionRange: 9` | Unfair → player can't strategize positioning |
| `regions: []` | `regions: ['rotmyrkr', 'gleymdariki']` | Empty array → enemy never spawns |
| `displayName: 'Shadow Beast'` in code | Use localization `messages/en.json` | Hardcoded strings break i18n |
| No testing | Complete checklist above | Bugs only found by users in production |

### Debugging Guide

**Problem: Enemy doesn't spawn**
1. ✅ Check `floorMin` / `floorMax` match current floor: `console.log(useDungeonStore.getState().currentFloor)`
2. ✅ Check `regions` include current region: `console.log(useDungeonStore.getState().currentRegion)`
3. ✅ Check enemy pool selection: Add breakpoint in `enemySpawner.ts` → `selectRandomEnemy()`
4. ✅ Verify `spawnWeight > 0` (weight 0 = never spawns)

**Problem: Wrong name displays**
1. ✅ Run `pnpm run compile-i18n` to regenerate Paraglide messages
2. ✅ Check `messages/en.json` and `messages/ja.json` have matching keys
3. ✅ Verify key format: `enemy_shadow_beast` (not `enemy-shadow-beast` or `enemyShadowBeast`)

**Problem: TypeScript errors**
1. ✅ Added to `EnemyTypeId` union in `types.ts`?
2. ✅ Added to `ENEMY_TYPES` record in `enemyTypes.ts`?
3. ✅ Run `pnpm build` to see full error context

**Problem: Enemy too weak/strong**
1. ✅ Compare stats to existing enemies on similar floors
2. ✅ Test damage formula: `max(1, attack - defense)` must produce 1-15 damage range
3. ✅ Check if hp / attack ratio matches intended archetype (tank vs. glass cannon)

## Anti-Patterns

| ❌ Forbidden | ✅ Correct | Why |
|--------------|------------|-----|
| `const store = useGameStore();` in `enemyAI.ts` | `const store = useGameStore.getState();` | Combat runs outside render cycle, hooks cause errors |
| `async processEnemyAI(enemy)` | `function processEnemyAI(enemy)` | Turn system is synchronous, async breaks execution order |
| `enemy.stats.hp = 0;` | `store.updateEnemy(enemy.id, { stats: { ...enemy.stats, hp: 0 } })` | Direct mutation bypasses Zustand reactivity |
| A* pathfinding with priority queue | Manhattan distance + greedy direction | Complex pathfinding hurts performance, simple AI sufficient for dungeon crawler |
| `spawnWeight: Math.random()` | `spawnWeight: 0.8` (constant) | Non-deterministic weights break testing and balance |
| `floorMin: 4.5` | `floorMin: 4` (integer) | Floors are always integers, fractional values never match |
