# AGENTS.md - Hooks

**Generated**: 2026-01-20 | **Commit**: 35f9005 | **Parent**: [../AGENTS.md](../AGENTS.md)

Custom React hooks for game systems: input handling, viewport management, performance monitoring, and effect processing.

## Hooks List

| Hook | Lines | Purpose |
|------|-------|---------|
| `useKeyboard` | 84 | Movement input with key repeat throttling (150ms default), debug toggle (F3), quickbar slots |
| `useViewport` | 28 | Player-centered viewport bounds calculation with map edge clamping |
| `usePerformanceMetrics` | 178 | FPS/frame time tracking with ring buffer (60 samples), Performance API marks |
| `useEffectProcessor` | 190 | Processes tile interaction effects (dungeon enter/exit, stairs, remnant trade) |
| `useLanguage` | 36 | Locale get/set wrapper for Paraglide i18n (reload-based switching) |

## Key Patterns

**Zustand Integration**: `useShallow` for multi-field selectors (see `useEffectProcessor` lines 60-87).

**Ref-based State**: Mutable state that shouldn't trigger re-renders uses `useRef`:
- `useKeyboard`: `pressedKeys`, `lastMoveTime` (input state)
- `usePerformanceMetrics`: `frameTimes` ring buffer, counters

**Interval Polling**: `useKeyboard` polls every 50ms for held-key movement (line 77-82).

**Ring Buffer**: `usePerformanceMetrics` uses `Float64Array(60)` with modulo indexing for memory-efficient sampling.

## Where to Look

| Task | Hook | Notes |
|------|------|-------|
| Add keyboard binding | `useKeyboard` | Add to `KEY_BINDINGS` in `utils/constants.ts` first |
| Change movement speed | `useKeyboard` | `moveDelay` option (default 150ms) |
| Modify viewport size | `useViewport` | Uses `VIEWPORT_WIDTH_TILES`, `VIEWPORT_HEIGHT_TILES` from constants |
| Add tile effect handler | `useEffectProcessor` | Add `else if` branch for new effect type |
| Track custom metric | `usePerformanceMetrics` | Use `mark()`/`endMark()` for named measurements |

## Conventions

- **Naming**: `use` prefix + descriptive noun (`useViewport`, not `useGetViewport`)
- **Dependencies**: All `useCallback`/`useEffect` deps must be exhaustive
- **Options pattern**: Pass config as single options object with defaults

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Store selectors without `useShallow` | Causes re-renders on unrelated changes | Wrap multi-field selectors |
| State for non-rendered values | Unnecessary re-renders | Use `useRef` for internal counters |
| Direct `getState()` in render | Bypasses reactivity | Use store hooks or effects |
| Missing cleanup in `useEffect` | Memory leaks | Always return cleanup function |
