# AGENTS.md - Vainholm

**Generated**: 2026-01-18 | **Commit**: b1bdced | **Branch**: main | **Tests**: 99 passing

Dark fantasy dungeon crawler: React 19 + Pixi.js 8 + Zustand 5 + TypeScript 5.9 (strict).

**6 Zustand stores** (NOT monolithic): gameStore, dungeonStore, progressionStore, inventoryStore, damageNumberStore, metaProgressionStore (persisted).

## Communication

- Always respond in Japanese unless explicitly instructed otherwise
- 日本語で応答すること（特に指示がない限り）

## LLM GUIDANCE (FOR AI CODE GENERATION)

**If you are an AI assistant generating code for this project, follow these guidelines.**

### Code Generation Workflow

1. **READ subsystem AGENTS.md FIRST** (e.g., `src/combat/AGENTS.md` for enemy additions)
   - Locate "COMPLETE EXAMPLE" section if available
   - Check "WHERE TO LOOK" table for file locations
   - Review "Anti-Patterns" to avoid common mistakes

2. **VERIFY DESIGN against GAMEPLAY VERIFICATION** (8 criteria below)
   - Does the content satisfy "Meaningful Choice" principle?
   - Does it create emergent interactions with 2+ existing systems?
   - Run through the verification checklist before implementing

3. **LOCATE EXACT FILES** using "WHERE TO LOOK" tables
   - DO NOT guess file paths — use the routing tables
   - Check cross-references (e.g., enemy types need both `enemyTypes.ts` AND `messages/*.json`)

4. **FOLLOW EXISTING PATTERNS** by reading implementation examples
   - Check 2-3 similar existing implementations (e.g., read existing enemy definitions)
   - Match naming conventions, structure, field order
   - Preserve code style (memo patterns, import order, type usage)

5. **ADD LOCALIZATION ENTRIES** for all user-facing strings
   - Add keys to `/messages/en.json` AND `/messages/ja.json`
   - Follow key naming: `enemy_*`, `upgrade_*`, `boss_*`, `region_*`
   - Run `pnpm run compile-i18n` after editing JSON

6. **VERIFY TYPE SAFETY** before marking complete
   - Run `pnpm build` — must pass without errors
   - Check `lsp_diagnostics` on modified files
   - NO `@ts-ignore`, `@ts-expect-error`, or `any` types allowed

7. **PROVIDE TESTING INSTRUCTIONS** in your response
   - Manual testing steps (how to trigger the new content)
   - Expected behavior (what should happen)
   - Edge cases to verify (floor restrictions, eligibility checks)

### Core Design Principles (NEVER VIOLATE)

| Principle | Rule | Violation Example |
|-----------|------|-------------------|
| **Meaningful Choice** | Both options have merit in different contexts | `upgradeA: +10 all stats` vs `upgradeB: +1 attack` (A strictly dominates) |
| **Transparency** | Player can predict outcomes from visible info | Hidden stats, vague descriptions, unpredictable mechanics |
| **Scarcity** | Limited availability creates tension | 100% drop rates, infinite inventory, universal upgrades |
| **Emergent Interaction** | Content interacts with 2+ existing systems | One-dimensional stat stick with no synergies |
| **Time Constraint** | Respects collapse system (~50 turns/floor) | Mandatory 100-turn puzzle, boss fights >30 turns |
| **Build Diversity** | Multiple viable strategies exist | One dominant build, linear progression paths |

### When to Ask for Clarification

**ALWAYS ASK** before implementing if:
- Multiple valid interpretations exist with 2x+ effort difference
- Design seems to violate core principles (see GAMEPLAY VERIFICATION)
- User's request contradicts existing codebase patterns
- Missing critical information (which floor range? which region? which stat tier?)

**PROCEED WITHOUT ASKING** if:
- Single valid interpretation
- Multiple interpretations with similar effort (pick most reasonable)
- Pattern matches existing examples exactly

### Evidence Requirements

Mark task complete ONLY after:
- [ ] `pnpm build` passes without errors
- [ ] Localization compiled (`pnpm run compile-i18n`)
- [ ] Manual testing instructions provided
- [ ] Design verified against GAMEPLAY VERIFICATION checklist

**NO EVIDENCE = INCOMPLETE WORK.**

### Common Pitfalls for LLMs

| Pitfall | Why It Happens | Mitigation |
|---------|----------------|------------|
| **Forgetting localization** | Focused on logic, forgot user-facing strings | Always check: Does this add UI text? Add to both `en.json` and `ja.json` |
| **Guessing file paths** | Didn't read "WHERE TO LOOK" table | ALWAYS use routing tables, never guess |
| **Skipping type definitions** | Added enum value but not TypeScript union | Check: Did I add to BOTH the enum AND the type union? |
| **Over-optimizing first pass** | Premature abstraction | Follow existing patterns first, optimize only if explicitly requested |
| **Ignoring Anti-Patterns** | Didn't read subsystem AGENTS.md | Read Anti-Patterns section BEFORE coding |
| **Creating strictly dominant choices** | Didn't verify against "Meaningful Choice" | Run design through GAMEPLAY VERIFICATION before implementing |
| **Breaking cross-store calls** | Used hooks instead of `.getState()` | Combat/progression run outside render cycle — use `.getState()` |

### Example Workflow (Adding Enemy)

```
1. READ: src/combat/AGENTS.md → "COMPLETE EXAMPLE: Adding a New Enemy Type"
2. VERIFY DESIGN:
   - Glass cannon (high attack, low HP)? ✅ Meaningful choice (engage vs. avoid)
   - Spawns floors 4-6? ✅ Scarcity (limited window)
   - High detection range? ✅ Emergent (interacts with stealth, positioning)
3. LOCATE FILES:
   - src/combat/types.ts → Add to EnemyTypeId
   - src/combat/enemyTypes.ts → Add definition
   - messages/en.json + messages/ja.json → Add localization
4. IMPLEMENT following "Shadow Beast" example structure
5. RUN: pnpm run compile-i18n
6. VERIFY: pnpm build (must pass)
7. PROVIDE testing steps: "Enter dungeon floor 4, region Rotmyrkr, verify enemy spawns"
```

### Key Files Reference (Quick Lookup)

| Content Type | Type Definition | Implementation | Localization |
|--------------|-----------------|----------------|--------------|
| Enemy | `combat/types.ts` → `EnemyTypeId` | `combat/enemyTypes.ts` | `messages/*.json` → `enemy_*` |
| Upgrade | `progression/types.ts` → `UpgradeId` | `progression/upgrades.ts` | `messages/*.json` → `upgrade_*` |
| Tile | `tiles/types.ts` → `TileType` | `tiles/registry.ts` | `tiles/tileTextures.ts` (texture) |
| Region | `dungeon/types.ts` → `RegionId` | `dungeon/config/` | `messages/*.json` → `region_*` |

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Type-check (`tsc -b`) + Vite build |
| `pnpm lint` | ESLint on all files |
| `pnpm test` | Vitest run (99 tests) |
| `pnpm similarity` | Detect duplicate code (threshold 0.7) |
| `pnpm deadcode` | Detect unused files/exports (knip) |

**Package Manager**: pnpm 10.28.0 (enforced)

## Architecture: Dual Rendering

**CRITICAL**: Two rendering systems coexist:

| System | Handles | Location |
|--------|---------|----------|
| React DOM | Layout, events, debug overlays, HUD | `GameContainer.tsx` |
| Pixi.js Canvas | ALL visual game content | `PixiViewport.tsx` (21 layers) |

See `src/components/game/AGENTS.md` for Pixi.js patterns.

## Project Structure

```
src/
├── components/
│   ├── game/          # Pixi.js rendering (see game/AGENTS.md)
│   └── ui/            # HUD (hud/), debug overlay, game over screen
├── hooks/             # useKeyboard, useViewport, usePerformanceMetrics, useEffectProcessor
├── stores/            # Zustand stores (see stores/AGENTS.md)
├── dungeon/           # Dungeon generation system (see dungeon/AGENTS.md)
├── combat/            # Turn-based combat (see combat/AGENTS.md)
├── progression/       # Level-up, upgrades, abilities (see progression/AGENTS.md)
├── items/             # Inventory, consumables
├── tiles/             # Tile registry: 63 types, ID mapping
├── types/             # Type definitions barrel
├── utils/             # Map generation, constants, textures (see utils/AGENTS.md)
│   └── mapGeneration/ # Phase-based pipeline (see mapGeneration/AGENTS.md)
├── paraglide/         # Generated i18n (Paraglide.js, ja/en)
└── assets/tiles/      # SVG textures (terrain, connected, transitions, overlays, animated)

docs/
└── GAME_DESIGN.md     # World setting (Vainholm), 4 regions, 8 floors (normal) / 16 floors (advanced)
```

## Code Map

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `useGameStore` | Hook | `stores/gameStore.ts` | Main state (1238 lines) |
| `useDungeonStore` | Hook | `dungeon/dungeonStore.ts` | Dungeon state |
| `useProgressionStore` | Hook | `progression/progressionStore.ts` | Level-up state |
| `useInventoryStore` | Hook | `items/inventoryStore.ts` | Inventory state |
| `useDamageNumberStore` | Hook | `stores/damageNumberStore.ts` | Floating damage |
| `PixiViewport` | Component | `components/game/PixiViewport.tsx` | WebGL rendering (21 layers) |
| `GameContainer` | Component | `components/game/GameContainer.tsx` | React orchestrator |
| `generateMapAsync` | Function | `utils/generateMapAsync.ts` | Web Worker map generation |
| `TILE_REGISTRY` | Constant | `tiles/registry.ts` | 63 tile definitions |
| `executeTurn` | Function | `combat/turnManager.ts` | Turn execution entry point |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add tile type | `tiles/registry.ts` + `utils/tileTextures.ts` | ID, properties, texture/fallback |
| Change rendering | `components/game/PixiViewport.tsx` | 21 layers, add after appropriate layer |
| Modify player movement | `stores/gameStore.ts` → `movePlayer` | Collision + visibility delta |
| Add keyboard binding | `utils/constants.ts` → `KEY_BINDINGS` | Then `hooks/useKeyboard.ts` |
| Add game state | `stores/gameStore.ts` | Interface + implementation |
| Add tile interaction | `utils/tileInteractions.ts` | Triggers, effects, chain reactions |
| Add dungeon region | `dungeon/config/` | Region config + add to index |
| Add map generation phase | `utils/mapGeneration/phases/` | See mapGeneration/AGENTS.md |
| Add enemy type | `combat/enemyTypes.ts` | Stats, behavior, spawning |
| Add upgrade | `progression/upgrades.ts` | Stats, effects, requirements |
| Add item | `items/consumables.ts` | Effect, stacking |
| Debug rendering | Press F3 | Shows FPS, frame time, memory |

## Import Order (ENFORCED)

```typescript
// 1. React
import { memo, useCallback, useEffect } from 'react';

// 2. External libraries
import { create } from 'zustand';

// 3. Types (type imports)
import type { Position, MapData } from '../types';

// 4. Internal modules
import { useGameStore } from '../../stores/gameStore';
import { TILE_SIZE } from '../../utils/constants';

// 5. Styles (last)
import styles from '../../styles/game.module.css';
```

## TypeScript Patterns

**Strict mode** — all flags active:
- `noUnusedLocals`, `noUnusedParameters` (use `_` prefix to ignore)
- `verbatimModuleSyntax` (enforces `import type`)
- `erasableSyntaxOnly` (TypeScript 5.9)

```typescript
// Use type imports for type-only
import type { Position } from '../types';

// Function declaration + memo for components
export const Tile = memo(function Tile({ type }: TileProps) {
  return <div />;
});
```

## Web Worker Pattern

Map generation runs in Web Worker (CPU-intensive):

```
generateMapAsync.ts  →  mapGenerator.worker.ts  →  mapGeneratorCore.ts
     Public API              Worker entry            Pure function
```

**Never**: Import `mapGeneratorCore` directly in main thread.

## Multi-Store Pattern

**6 independent Zustand stores** (NOT monolithic):

| Store | Purpose | Location |
|-------|---------|----------|
| `gameStore` | World map, player, visibility, weather, time, combat | `stores/gameStore.ts` |
| `dungeonStore` | Dungeon floors, navigation, regions | `dungeon/dungeonStore.ts` |
| `progressionStore` | Level-up, upgrades, abilities | `progression/progressionStore.ts` |
| `inventoryStore` | Items, consumables, slots | `items/inventoryStore.ts` |
| `damageNumberStore` | Floating damage animation | `stores/damageNumberStore.ts` |
| `metaProgressionStore` | Enemy/boss encounters, relics, unlocks (persisted) | `stores/metaProgressionStore.ts` |

**Cross-store calls**: Use `.getState()` for inter-store communication (NOT hooks in non-React code).

**Transition**: `cacheWorldMap()` / `restoreWorldMap()` for world↔dungeon swaps.

See `stores/AGENTS.md` for detailed store patterns.

## Visibility Delta Optimization

Player visibility uses incremental delta for 1-tile moves:
```typescript
getVisibilityDelta(oldX, oldY, newX, newY): { toAdd: Position[], toRemove: Position[] }
```

**Visibility Hash**: `playerX * 10000 + playerY` — memoization key for FogOfWarLayer.

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase | `GameContainer` |
| Hooks | camelCase + `use` | `useKeyboard` |
| Types | PascalCase | `Position`, `MapData` |
| Constants | SCREAMING_SNAKE | `TILE_SIZE`, `MAP_WIDTH` |
| Files | camelCase (utils), PascalCase (components) | `useKeyboard.ts`, `GameContainer.tsx` |
| Phase functions | camelCase + "Phase" | `riverPhase`, `lakesPhase` |
| Phase exports | SCREAMING_SNAKE + "_PHASE" | `RIVER_PHASE`, `LAKES_PHASE` |

## Anti-Patterns (FORBIDDEN)

| Pattern | Why |
|---------|-----|
| `any` type | Use proper types or `unknown` with guards |
| `@ts-ignore` / `@ts-expect-error` | Fix the type error properly |
| Inline TextStyle/BlurFilter | Recreated every render — memoize at module level |
| React DOM in PixiViewport | Pixi handles ALL visual rendering |
| Import `mapGeneratorCore` in main thread | CPU-intensive, blocks UI |
| Deep imports (`../../../..`) | Max 3 levels, refactor if deeper |
| Business logic in components | Extract to hooks or utils |
| Hooks in combat functions | Combat runs outside render cycle |
| Cross-store direct mutation | Use store actions |

## Tile System

**63 tile types** across categories:

| Category | Examples | Count |
|----------|----------|-------|
| Terrain | grass, water, sand, snow, lava | 9 |
| Features | forest, mountain, hills, wall | 4 |
| Dungeon | dungeon_floor, dungeon_wall, stairs_* | 4 |
| Doors | door, door_open, door_locked, door_secret | 4 |
| Traps | trap_spike, trap_pit, pressure_plate, web | 4 |
| Hazards | miasma, blight, toxic_marsh, cursed_ground | 6 |
| Structures | pillar, altar_dark, brazier, wall_torch | 8 |
| Decay | blood, bone_pile, rubble, lichen | 7 |
| Animated | water, lava, swamp, wall_torch (11 types × 4 frames) | 11 |

**Texture Fallback**: 43 tiles reuse 14 base SVGs. See `utils/tileTextures.ts`.

## Testing

**Framework**: Vitest 4.0.16 (99 tests passing)

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `mapGeneratorCore.test.ts` | 56 | Procedural generation, determinism |
| `floorGenerator.test.ts` | 19 | Dungeon connectivity, reachability |
| `LightLayer.test.ts` | 6 | Light calculations |
| `progressionStore.test.ts` | 3 | Upgrade selection |
| `i18n.test.ts` | 4 | Localization |

**Pattern**: Co-located tests (`.test.ts`), seeded randomness for determinism, no mocking.

```bash
pnpm test        # Run once
pnpm test:watch  # Watch mode
```

## Performance

- **`memo()`** on frequently re-rendered components (all Pixi layers)
- **`useCallback`** for handlers passed as props
- **`useMemo`** for expensive computations
- **`useShallow`** for multi-field Zustand selectors
- **Visibility hashing** for FogOfWarLayer memoization
- **Texture caching** — SVGs loaded once, reused
- **Module-level filters** — BlurFilter wrapped in IIFE

## Code Quality

| Tool | Purpose | Command |
|------|---------|---------|
| similarity-ts | Duplicate detection | `pnpm similarity` |
| knip | Dead code detection | `pnpm deadcode` |
| ESLint | Linting (flat config) | `pnpm lint` |
| TypeScript | Type checking | `pnpm build` |

## Complexity Hotspots

| File | Lines | Notes |
|------|-------|-------|
| `PixiViewport.tsx` | 1372 | 21 layers — candidate for splitting |
| `gameStore.ts` | 1238 | Visibility delta, map caching, combat, hub store |
| `floorGenerator.ts` | 937 | Dungeon floor pipeline, collapse zones |
| `tileTextures.ts` | 682 | 168 imports — fallback chain |
| `bspGenerator.ts` | 437 | BSP algorithm, Union-Find |
| `tileInteractions.ts` | 331 | 35+ interactions, chain reactions |

## GAMEPLAY VERIFICATION

When adding or modifying game content (enemies, upgrades, items, dungeon features), verify against these 8 design principles derived from our core inspirations: **Brogue** (emergent depth), **片道勇者** (time constraint), **ハクスラ** (loot hunting).

### 1. Meaningful Choice (Brogue)

**Definition**: Both options have merit; no strictly dominant choice.

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| Upgrade A: +5 attack, -2 defense<br>Upgrade B: +3 attack, +1 defense | Upgrade A: +10 attack, +5 defense<br>Upgrade B: +2 attack, +0 defense | **GOOD**: Context-dependent (A = glass cannon, B = balanced). **BAD**: A is strictly better—no reason to choose B. |
| Enemy spawns in narrow corridors (forces engagement)<br>Enemy spawns in open rooms (can kite) | Enemy always spawns adjacent to player | **GOOD**: Positioning matters. **BAD**: No strategic planning possible. |
| Weapon: High attack, slow speed<br>Weapon: Low attack, fast speed | Weapon: High attack, fast speed, no downside | **GOOD**: Trade-offs enable build diversity. **BAD**: One weapon dominates all scenarios. |

**Test**: Can you describe a scenario where each option is preferable? If not, the choice is meaningless.

### 2. Transparency (Brogue)

**Definition**: Player can predict outcomes from visible information.

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| Enemy stat visible after first encounter (HP, attack, defense shown) | Hidden stats, damage varies unpredictably | **GOOD**: Player learns and plans. **BAD**: Feels random, no skill expression. |
| Trap visible with "Trap Sense" upgrade | Trap completely invisible, instant death | **GOOD**: Skill-gated information. **BAD**: Trial-and-error is not strategy. |
| Upgrade description: "+20% damage when HP < 30%" | Upgrade description: "Become stronger in danger" (vague) | **GOOD**: Player can calculate value. **BAD**: Cannot make informed decision. |

**Test**: Can the player predict the consequence of their action without trying it first?

### 3. Scarcity (Brogue)

**Definition**: Limited resources create tension and meaningful planning.

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| Healing potion: 15% drop rate, max 3 inventory slots | Healing potion: 80% drop rate, infinite slots | **GOOD**: "Do I use now or save?" is a decision. **BAD**: Always spam heal, no tension. |
| Upgrade appears only floors 4-6 (2-3 chances) | Upgrade available every level-up, floors 1-8 | **GOOD**: Rare → high perceived value. **BAD**: Universal → feels generic. |
| Rare enemy: spawnWeight 0.3 (30% of standard) | Common enemy: spawnWeight 3.0 (3× standard) | **GOOD**: Encounter feels special. **BAD**: Dilutes enemy variety. |

**Test**: Does acquiring this feel like an event, or routine?

### 4. Emergent Interaction (Brogue)

**Definition**: New content interacts with 2+ existing systems, creating unforeseen strategies.

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| Trap: Deals damage + applies Slow status<br>**Interacts with**: Player positioning, enemy AI (chases into traps), Slow-resist armor | Trap: Deals fixed 10 damage, nothing else | **GOOD**: Enables trap-kiting, positioning play. **BAD**: One-dimensional, no combos. |
| Upgrade: +50% critical chance when HP full<br>**Interacts with**: Healing items (HP management), defensive play, glass cannon builds | Upgrade: +2 attack (flat bonus) | **GOOD**: Changes playstyle, enables high-risk strategies. **BAD**: Boring stat stick. |
| Enemy: High attack, low HP, charge AI (moves 2 tiles)<br>**Interacts with**: Doorways (choke points), ranged weapons, knockback effects | Enemy: Standard melee, no special behavior | **GOOD**: Positioning-dependent threat. **BAD**: Generic, forgettable. |

**Test**: Can you name 3+ existing mechanics this new content interacts with?

### 5. Time Constraint Respect (片道勇者)

**Definition**: Content respects the collapse system's time pressure (200 turn start, 50 turns/floor).

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| Optional treasure room: 10 turns to explore, 20% loot upgrade | Mandatory 100-turn puzzle blocking progression | **GOOD**: Risk vs. reward under time pressure. **BAD**: Forces tedium, breaks pacing. |
| Boss fight: 15-20 turns average | Boss fight: 80 turns minimum | **GOOD**: Fits within floor budget (50 turns). **BAD**: Eats entire floor, no exploration time. |
| Enemy: Patrols predictably, can be avoided with positioning | Enemy: Infinite detection range, impossible to avoid | **GOOD**: Stealth option saves turns. **BAD**: Forces every fight, pacing drags. |

**Test**: Does this content respect the ~50 turn/floor budget? Does it enable turn-efficient play?

### 6. Session Length (片道勇者)

**Definition**: Full run fits 30-45 min target (8 floors × ~50 turns + boss fights).

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| Upgrade selection: 4 choices, instant decision | Upgrade selection: 20 choices, complex dependencies | **GOOD**: Quick decision keeps pacing. **BAD**: Analysis paralysis breaks flow. |
| Enemy: Dies in 3-5 hits (15 HP, 5 attack formula) | Enemy: Dies in 30+ hits (300 HP tank) | **GOOD**: Fast combat resolution. **BAD**: Single fight takes 5+ minutes. |
| Trap: Instant effect (damage/status), move on | Trap: Triggers 5-turn timed puzzle | **GOOD**: Immediate consequence. **BAD**: Breaks roguelike flow. |

**Test**: Does this content add >5 minutes to a full run? If yes, justify or cut.

### 7. Meta-Progression Balance (片道勇者)

**Definition**: Unlocks expand choices, NOT raw power (avoid power creep).

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| Unlock: New class with different ability (e.g., Hunter: Trap Detection) | Unlock: +50% starting stats for all characters | **GOOD**: Horizontal progression. **BAD**: Trivializes core challenge. |
| Unlock: Rare enemy type (adds encounter variety) | Unlock: Start at floor 5 (skip content) | **GOOD**: Enriches gameplay. **BAD**: Defeats the point of roguelike. |
| Unlock: Relic with trade-off (+attack, -defense) | Unlock: Permanent invincibility item | **GOOD**: Still requires skill. **BAD**: Removes all challenge. |

**Test**: Does this unlock make the game more interesting or just easier?

### 8. Build Diversity (ハクスラ)

**Definition**: Multiple viable builds exist; no single "best" path.

| ✅ GOOD | ❌ BAD | Why |
|---------|--------|-----|
| **Tank build**: High HP/defense, retaliation, slow weapon<br>**Glass cannon**: High attack, low defense, critical bonuses<br>**Stealth**: Trap detection, backstab damage, evasion | Only one viable path: Stack attack → delete everything | **GOOD**: 3+ distinct archetypes. **BAD**: No build identity, linear progression. |
| Upgrade pool: 40% stat, 25% passive, 20% weapon, 15% active | Upgrade pool: 95% flat stat bonuses | **GOOD**: Diverse options each run. **BAD**: All builds feel identical. |
| Weapon types: Sword (balanced), Axe (AoE), Spear (range), Dagger (crit) | All weapons: Linear DPS upgrades (Sword < Axe < Spear) | **GOOD**: Situational strengths. **BAD**: One weapon type dominates. |

**Test**: Can you win with 3+ completely different strategies? If not, builds are shallow.

---

## VERIFICATION CHECKLIST

When adding new content, run through this checklist:

```
[ ] Meaningful Choice: Both options have merit in different scenarios
[ ] Transparency: Player can predict outcome from visible information
[ ] Scarcity: Resource is limited enough to create tension
[ ] Emergent Interaction: Content interacts with 2+ existing systems
[ ] Time Constraint: Fits within ~50 turn/floor budget
[ ] Session Length: Doesn't add >5 minutes to full run
[ ] Meta-Progression: Unlocks expand choices, not raw power
[ ] Build Diversity: Enables new builds, doesn't invalidate existing ones
```

If ANY checkbox fails, revisit the design before implementation.

---

## Subdirectory Documentation

| Path | Purpose |
|------|---------|
| `src/components/game/AGENTS.md` | Pixi.js 21-layer rendering |
| `src/components/ui/AGENTS.md` | React DOM UI layer (screens, modals, overlays) |
| `src/components/ui/hud/AGENTS.md` | React DOM HUD overlay |
| `src/dungeon/AGENTS.md` | BSP dungeon generation |
| `src/dungeon/config/AGENTS.md` | Region configurations (4 regions) |
| `src/dungeon/generator/AGENTS.md` | BSP algorithm + floor generation pipeline |
| `src/hooks/AGENTS.md` | Custom React hooks (input, viewport, performance, effects) |
| `src/utils/AGENTS.md` | Utilities, textures, lighting |
| `src/utils/mapGeneration/AGENTS.md` | Phase-based generation pipeline |
| `src/utils/mapGeneration/phases/AGENTS.md` | 12 phase implementations |
| `src/combat/AGENTS.md` | Turn-based combat system |
| `src/stores/AGENTS.md` | Zustand store patterns, cross-store communication |
| `src/progression/AGENTS.md` | Level-up system, upgrades, abilities |
