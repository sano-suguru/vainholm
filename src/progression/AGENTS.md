# AGENTS.md - src/progression

**Generated**: 2026-01-18 | **Commit**: 0b652eb | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Level-up system. Weighted upgrade selection, passive effects, active abilities.

## Architecture

| File | Purpose | Lines |
|------|---------|-------|
| `progressionStore.ts` | Zustand store: level-up state, upgrade selection | 176 |
| `upgrades.ts` | Upgrade pool definitions, stat modifiers | — |
| `types.ts` | Type definitions (UpgradeId, PassiveEffectId, ActiveAbilityId) | — |
| `remnants.ts` | Remnant trade definitions per region | — |
| `relics.ts` | Relic definitions, effects | — |
| `index.ts` | Barrel export | — |
| `progressionStore.test.ts` | 3 tests for upgrade selection | — |

## Level-Up Flow

```
Player descends floor N
    ↓
GameContainer: checkLevelUp(floor)
    ↓
Every 2 floors → triggerLevelUp(floor)
    ↓
generateChoices(floor) → 4 weighted random upgrades
    ↓
LevelUpScreen displays choices
    ↓
selectUpgrade(upgradeId)
    ├─→ Apply statModifiers → gameStore.applyStatModifiers()
    ├─→ Add passiveEffect to passiveEffects[]
    └─→ Add activeAbility to activeAbilities[]
```

**Level Threshold**: `FLOORS_PER_LEVEL_UP = 2` (level up every 2 floors)

## Upgrade Selection Algorithm

```typescript
function generateChoices(floor: number): UpgradeDefinition[] {
  // 1. Filter eligible upgrades
  const eligible = UPGRADE_POOL.filter((upgrade) => {
    if (acquiredUpgrades.includes(upgrade.id)) return false;  // Already owned
    if (upgrade.minFloor && floor < upgrade.minFloor) return false;
    if (upgrade.maxFloor && floor > upgrade.maxFloor) return false;
    if (upgrade.requiredUpgrades?.some(req => !acquiredUpgrades.includes(req))) return false;
    if (upgrade.excludedUpgrades?.some(exc => acquiredUpgrades.includes(exc))) return false;
    return true;
  });

  // 2. Weighted random selection (4 choices)
  return selectWeightedRandom(eligible, CHOICES_PER_LEVEL_UP, Math.random);
}
```

## Upgrade Definition Structure

```typescript
interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  displayName: string;           // Japanese localized
  description: string;
  weight?: number;               // Selection weight (default: 1)
  minFloor?: number;             // Earliest appearance
  maxFloor?: number;             // Latest appearance
  requiredUpgrades?: UpgradeId[];
  excludedUpgrades?: UpgradeId[];
  statModifiers?: StatModifier[];
  passiveEffect?: PassiveEffectId;
  activeAbility?: ActiveAbilityId;
}
```

## Stat Modifiers

Applied to player via `gameStore.applyStatModifiers()`:

```typescript
type StatModifier = 
  | { type: 'hp_flat'; value: number }
  | { type: 'hp_percent'; value: number }
  | { type: 'attack_flat'; value: number }
  | { type: 'attack_percent'; value: number }
  | { type: 'defense_flat'; value: number }
  | { type: 'defense_percent'; value: number };
```

## Cross-Store Integration

```typescript
// progressionStore → gameStore
selectUpgrade: (upgradeId) => {
  if (upgrade.statModifiers) {
    useGameStore.getState().applyStatModifiers(upgrade.statModifiers);
  }
  // ... update local state
}
```

**Pattern**: `.getState()` for cross-store calls (not hooks).

## Passive Effects

Stored in `passiveEffects[]`, checked via `hasPassiveEffect()`:

| Effect | Description |
|--------|-------------|
| `trap_detection` | Hunter class: See traps |
| `retaliation` | Warrior class: Counter-attack |
| `appraisal` | Scholar class: Pre-identify items |

## Active Abilities

Stored in `activeAbilities[]` with usage tracking:

```typescript
interface ActiveAbilityState {
  id: ActiveAbilityId;
  usesRemaining: number;
  cooldown: number;
}
```

## Remnant Trades

Region-specific trades (cost remnants for benefits):

```typescript
interface RemnantTrade {
  id: string;
  cost: number;               // Remnants required
  effect: RemnantTradeEffect;
}
```

Located in `remnants.ts`, accessed via GameContainer.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add upgrade | `upgrades.ts` → `UPGRADE_POOL` |
| Add passive effect | `types.ts` → `PassiveEffectId`, then check in combat |
| Add active ability | `types.ts` → `ActiveAbilityId`, then implement in combat |
| Add remnant trade | `remnants.ts` |
| Add relic | `relics.ts` |
| Change level-up frequency | `progressionStore.ts` → `FLOORS_PER_LEVEL_UP` |
| Change choices count | `progressionStore.ts` → `CHOICES_PER_LEVEL_UP` |

## Testing

3 tests in `progressionStore.test.ts`:
- Upgrade selection applies stat modifiers
- Cross-store integration with gameStore
- Weighted random selection

```bash
pnpm test src/progression
```

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Use hooks in selectUpgrade | Cross-store, use `.getState()` |
| Mutate acquiredUpgrades directly | Use immutable spread |
| Skip eligibility checks | Duplicates, broken requirements |
| Hardcode floor thresholds | Use `minFloor`/`maxFloor` |
