# AGENTS.md - src/progression

**Generated**: 2026-01-18 | **Commit**: b1bdced | **Parent**: [../../AGENTS.md](../../AGENTS.md)

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

## COMPLETE EXAMPLE: Adding a New Upgrade

This section shows the complete process of adding a new upgrade called "Berserker's Rage" (狂戦士の怒り).

### Step 1: Add to Upgrade Pool in `upgrades.ts`

```typescript
export const UPGRADE_POOL: UpgradeDefinition[] = [
  // ... existing upgrades ...
  
  {
    id: 'berserker_rage',
    category: 'passive',
    nameKey: 'upgrade_berserker_rage',
    descriptionKey: 'upgrade_berserker_rage_desc',
    passiveEffect: 'berserker_rage',
    statModifiers: [
      { stat: 'attack', value: 5 },    // +5 attack
      { stat: 'defense', value: -2 },  // -2 defense (glass cannon)
    ],
    minFloor: 4,                       // Available from floor 4
    maxFloor: 8,                       // Available until floor 8
    excludedUpgrades: ['defensive_stance'],  // Conflicts with defensive build
    weight: 0.7,                       // Slightly rare (1.0 = standard)
  },
];
```

**Design Rationale**:
- **Trade-off design**: +5 attack, -2 defense creates meaningful choice (Brogue principle)
- **Mid-game timing**: minFloor 4 ensures player has defensive options before offering glass cannon
- **Excludes defensive_stance**: Prevents conflicting build paths, maintains build coherence
- **weight 0.7**: Slightly rarer than standard (1.0) to preserve perceived value

### Step 2: Add Passive Effect ID to `types.ts`

```typescript
export type PassiveEffectId =
  | 'night_vision'
  | 'trap_sense'
  | 'iron_stomach'
  | 'quick_feet'
  | 'thick_skin'
  | 'lucky'
  | 'regeneration'
  | 'scavenger'
  | 'berserker_rage';  // ← Add this line
```

### Step 3: Add Localization Entries

**File: `/messages/en.json`**
```json
{
  "upgrade_berserker_rage": "Berserker's Rage",
  "upgrade_berserker_rage_desc": "Gain +5 attack but lose 2 defense. High risk, high reward."
}
```

**File: `/messages/ja.json`**
```json
{
  "upgrade_berserker_rage": "狂戦士の怒り",
  "upgrade_berserker_rage_desc": "攻撃力+5、防御力-2。ハイリスク・ハイリターン。"
}
```

**After editing JSON files, run**:
```bash
pnpm run compile-i18n  # Regenerates Paraglide messages
```

### Step 4: Implement Passive Effect Logic (if needed)

**Location**: Check where passive effects are applied (e.g., `gameStore.ts` or combat functions)

```typescript
// Example: In combat damage calculation
function calculateDamage(attacker: CombatStats, defender: CombatStats, passives: PassiveEffectId[]): number {
  let damage = Math.max(1, attacker.attack - defender.defense);
  
  // Berserker's Rage: +20% damage when HP below 30%
  if (passives.includes('berserker_rage')) {
    const hpPercent = attacker.hp / attacker.maxHp;
    if (hpPercent < 0.3) {
      damage = Math.floor(damage * 1.2);
    }
  }
  
  return damage;
}
```

**Note**: If the upgrade only provides stat modifiers (like in Step 1), no additional logic is needed—stat modifiers are applied automatically via `gameStore.applyStatModifiers()`.

### Step 5: Manual Testing Checklist

| Test | How | Expected Result |
|------|-----|----------------|
| **Appearance** | 1. Start new game<br>2. Reach floor 4<br>3. Check level-up choices | "Berserker's Rage" appears in upgrade pool |
| **Eligibility (Floor)** | Level up on floor 2 | Does NOT appear (minFloor: 4) |
| **Eligibility (Exclusion)** | 1. Acquire "Defensive Stance"<br>2. Level up again | "Berserker's Rage" does NOT appear |
| **Stat Application** | 1. Note stats before selection<br>2. Select upgrade<br>3. Check stats panel | Attack +5, Defense -2 applied |
| **Passive Effect** | Reduce HP below 30%, attack enemy | Damage increased by 20% (if passive logic added) |
| **Localization** | Switch language (F9) | Name/description display correctly |
| **No Duplication** | 1. Select upgrade<br>2. Level up again | Does NOT appear in future choices |

### Step 6: Verify Type Safety

```bash
pnpm build  # Must pass without TypeScript errors
```

Common errors:
- ❌ `Type '"berserker_rage"' is not assignable to type 'PassiveEffectId'` → Forgot Step 2
- ❌ `Property 'nameKey' is missing` → Incomplete definition in Step 1

### Why This Works

**1. Meaningful Choice (Brogue Principle)**:
- **Trade-off**: +5 attack / -2 defense is NOT strictly superior to +3 attack / +0 defense
- **Build commitment**: Excludes defensive upgrades, forces player to commit to glass cannon path
- **Context-dependent value**: High value for high-skill players, risky for beginners

**2. Transparency (Brogue Principle)**:
- Stats shown in upgrade description → Player can predict outcome
- Passive effect trigger (HP < 30%) clearly communicated
- No hidden mechanics

**3. Scarcity (Brogue Principle)**:
- weight 0.7 → 30% rarer than standard upgrades
- Limited floor range (4-8) → Only 2-3 level-up opportunities to acquire
- Mutual exclusion with defensive_stance → Cannot hedge bets

**4. Emergent Interaction**:
- **With weapons**: Multiplies weapon attack bonus (synergy)
- **With armor**: Mitigates defense penalty (strategic planning)
- **With healing items**: Enables aggressive play despite low defense
- **With passive "Thick Skin"**: Can offset defense penalty

### Common Mistakes to Avoid

| ❌ BAD | ✅ GOOD | Why |
|--------|---------|-----|
| `weight: 10.0` | `weight: 0.7` | Too common → dilutes rarity, reduces perceived value |
| `minFloor: 1` for glass cannon | `minFloor: 4` | Early game lacks defensive options, unfair for new players |
| No `excludedUpgrades` | `excludedUpgrades: ['defensive_stance']` | Conflicting upgrades create incoherent builds |
| `statModifiers: [{ stat: 'attack', value: 50 }]` | `value: 5` | Extreme values break balance formula |
| `nameKey: "Berserker's Rage"` (direct string) | `nameKey: 'upgrade_berserker_rage'` (localization key) | Hardcoded strings break i18n |
| Only positive stats | Trade-off (positive + negative) | Strictly superior upgrades reduce meaningful choice |
| `requiredUpgrades: ['legendary_sword', 'divine_armor']` | Single requirement or none | Too many requirements = never eligible |

### Debugging Guide

**Problem: Upgrade doesn't appear in level-up choices**
1. ✅ Check floor range: `console.log(useDungeonStore.getState().currentFloor)` must be between minFloor and maxFloor
2. ✅ Check acquired upgrades: `console.log(useProgressionStore.getState().acquiredUpgrades)` — already owned?
3. ✅ Check excluded upgrades: Do you have any upgrades in `excludedUpgrades` list?
4. ✅ Check required upgrades: Do you have ALL upgrades in `requiredUpgrades` list?
5. ✅ Verify weight > 0: `weight: 0` = never appears
6. ✅ Add breakpoint in `progressionStore.ts` → `generateChoices()` to inspect eligibility

**Problem: Stat modifiers not applied**
1. ✅ Check `selectUpgrade` in `progressionStore.ts` calls `gameStore.getState().applyStatModifiers()`
2. ✅ Verify stat names match: `'attack'` (not `'atk'` or `'attackPower'`)
3. ✅ Check player stats in React DevTools: `useGameStore.getState().player.stats`

**Problem: Wrong text displays**
1. ✅ Run `pnpm run compile-i18n` after editing JSON files
2. ✅ Check key format: `upgrade_berserker_rage` (snake_case, not camelCase)
3. ✅ Verify both `en.json` and `ja.json` have the keys

**Problem: Passive effect not working**
1. ✅ Did you implement the logic? (Step 4) — Stat modifiers are automatic, but passive effects need custom code
2. ✅ Check where the effect should trigger (combat, movement, etc.)
3. ✅ Add `console.log` to verify passive is in `passiveEffects` array

## Anti-Patterns

| ❌ Forbidden | ✅ Correct | Why |
|--------------|------------|-----|
| `const store = useProgressionStore();` in selectUpgrade | `useGameStore.getState()` | Cross-store, use `.getState()` not hooks |
| `acquiredUpgrades.push(upgradeId)` | `acquiredUpgrades: [...state.acquiredUpgrades, upgradeId]` | Direct mutation breaks Zustand reactivity |
| Skip eligibility checks in generateChoices | Always filter by floor, requirements, exclusions | Duplicates, broken dependencies, incoherent builds |
| `minFloor: 3.5` (fractional) | `minFloor: 4` (integer) | Floors are always integers, fractional never matches |
| `weight: Math.random()` | `weight: 0.7` (constant) | Non-deterministic weights break balance testing |
| `excludedUpgrades: []` for all builds | Mutual exclusion for conflicting paths | No build identity, everything becomes generic stat pile |
