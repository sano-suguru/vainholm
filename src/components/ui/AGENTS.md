# AGENTS.md - src/components/ui

**Generated**: 2026-01-20 | **Commit**: 01d37f0 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

React DOM UI layer. Full-screen screens, modal overlays, debug info. NOT Pixi.js rendering.

## Architecture

| Component | Type | Lines | Purpose |
|-----------|------|-------|---------|
| `TitleScreen` | Screen | 95 | Entry, meta-progression stats, encyclopedia |
| `CharacterSelectionScreen` | Screen | 188 | Class/background/mode selection |
| `GameOverScreen` | Screen | 79 | Victory/defeat, advanced mode unlock |
| `EncyclopediaScreen` | Screen | 301 | Enemy/boss/remnant discovery tabs |
| `LevelUpScreen` | Modal | 70 | Upgrade card selection |
| `RemnantTradeModal` | Modal | 108 | NPC trade benefit/cost |
| `WeaponDropModal` | Modal | 122 | Weapon comparison |
| `DebugInfo` | Overlay | 56 | FPS, position, memory (F3) |
| `LanguageSwitcher` | Widget | 25 | ja/en toggle |
| `hud/` | Subdir | — | [hud/AGENTS.md](hud/AGENTS.md) |

## Screen Flow

```
TitleScreen → CharacterSelectionScreen → [Game] → GameOverScreen
                                            ↓
                              LevelUpScreen / RemnantTradeModal / WeaponDropModal
```

## State Access

- **Screens**: `useMetaProgressionStore` for persistent meta-progression
- **Modals**: Props from `GameContainer` (transient game state)

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add screen | New file + wire in `GameContainer.tsx` |
| Add modal | New file + state in `gameStore.ts` |
| Victory/defeat flow | `GameOverScreen.tsx` |
| Meta-progression stat | `TitleScreen.tsx` + `metaProgressionStore.ts` |
| Encyclopedia tab | `EncyclopediaScreen.tsx` |
| Upgrade UI | `LevelUpScreen.tsx` |

## Conventions

- `memo()` on ALL components
- `useShallow` for multi-selector Zustand
- `useCallback` for all handlers
- Callback props: `onSelect`, `onConfirm`, `onBack`
- Symbol maps for icons: `CATEGORY_SYMBOLS`, `CLASS_SYMBOLS`

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| Pixi.js imports | Wrong layer — use `game/` |
| Direct store mutations | Use store actions |
| Inline styles (except dynamic) | Use CSS modules |
