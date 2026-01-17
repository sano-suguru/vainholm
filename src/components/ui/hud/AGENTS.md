# AGENTS.md - src/components/ui/hud

**Generated**: 2026-01-17 | **Parent**: [../../../../AGENTS.md](../../../../AGENTS.md)

React DOM HUD overlay. Fixed position, non-blocking, pointer-events selective.

## Architecture

| File | Role | Lines |
|------|------|-------|
| `Hud.tsx` | Root orchestrator, composes sub-components | 65 |
| `TopBar.tsx` | Region name, floor number, turn counter | 33 |
| `StatusBar.tsx` | HP bar + attack/defense stats | 59 |
| `CombatLog.tsx` | Combat event history (last 5 entries) | 52 |
| `BossHealthBar.tsx` | Boss HP tracking | — |
| `StatusEffectsDisplay.tsx` | Active status effect icons | — |
| `index.ts` | Barrel export | 7 |

## Component Hierarchy

```
<Hud>
  ├── <TopBar />             # Fixed top (36px)
  ├── <StatusBar />          # Below TopBar (28px)
  ├── <StatusEffectsDisplay /> # Status icons
  ├── <BossHealthBar />      # Boss HP (when active)
  └── <CombatLog />          # Left sidebar (200px width)
</Hud>
```

## State Access Pattern

```typescript
// Dual store access with useShallow optimization
const { player, tick, combatLog } = useGameStore(useShallow(...));
const { dungeon, isInDungeon, currentRegion } = useDungeonStore(useShallow(...));
```

**Note**: HUD reads directly from stores, not via props from GameContainer.

## HP Bar States

| HP % | State | CSS Class | Effect |
|------|-------|-----------|--------|
| 100-50% | Healthy | `.hpFillHealthy` | Deep red |
| 50-25% | Warning | `.hpFillWarning` | Orange |
| <25% | Critical | `.hpFillCritical` | Red + pulse animation |

## Combat Log Entry Types

| Type | Color | CSS Class |
|------|-------|-----------|
| `player_attack` | Green | `.logDamageDealt` |
| `enemy_attack` | Red | `.logDamageTaken` |
| `enemy_death` | Bold red | `.logDeath` |
| `player_death` | Bold red | `.logDeath` |
| `critical` | Emphasized | `.logCritical` |

## CSS Pattern

All styles in `src/styles/game.module.css`. CSS variables in `variables.css`:

```css
--hud-bg: rgba(15, 12, 10, 0.92);
--hud-text-primary: #a89878;
--hp-healthy: #8b2020;
--hp-warning: #c56020;
--hp-critical: #cc3030;
--log-damage-dealt: #7a9a6a;
--log-damage-taken: #9a5a5a;
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add HUD element | `Hud.tsx` → add component |
| Change HP thresholds | `StatusBar.tsx` → `getHpState()` |
| Add log entry type | `CombatLog.tsx` + `game.module.css` |
| Modify positioning | `game.module.css` → `.hud*` classes |
| Add CSS variable | `variables.css` |
| Add status effect icon | `StatusEffectsDisplay.tsx` |

## Conventions

- `memo()` wrapper on ALL components
- `useShallow` for multi-selector Zustand
- `useMemo` for derived state (HP %, visible entries)
- CSS modules imported as `styles`
- No inline styles except dynamic `width` for bars

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Business logic in HUD | Extract to stores/hooks |
| Hardcoded colors | Use CSS variables |
| Skip `memo()` wrapper | Causes unnecessary re-renders |
| Pass entire store state | Use specific selectors |
| Inline complex calculations | Use `useMemo` |
