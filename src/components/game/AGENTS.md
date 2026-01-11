# AGENTS.md - src/components/game

**Generated**: 2026-01-12 | **Parent**: [../../../AGENTS.md](../../../AGENTS.md)

Pixi.js rendering layer for Vainholm. ALL visual game content rendered here.

## Architecture

**Dual Rendering System**:
- `GameContainer.tsx` — React DOM (layout, events, debug, Zustand connection)
- `PixiViewport.tsx` — Pixi.js WebGL (tiles, player, effects, weather)

## File Roles

| File | Purpose |
|------|---------|
| `GameContainer.tsx` | Orchestrator: map init, keyboard/click handlers, state subscriptions |
| `PixiViewport.tsx` | Pixi Application + 11-layer scene graph |
| `index.ts` | Barrel exports |
| `LightLayer.tsx` | Light source rendering with flicker |

## Pixi.js Setup

```typescript
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics, Text, TextStyle, BlurFilter } from 'pixi.js';

extend({ Container, Graphics, Text }); // MUST call before JSX usage
```

## JSX Element Naming (CRITICAL)

Use **lowercase prefix** for Pixi elements:
- `<pixiContainer>` not `<Container>`
- `<pixiGraphics>` not `<Graphics>`
- `<pixiText>` not `<Text>`

Required by `@pixi/react`.

## Layer Order (Z-Index)

Rendered bottom-to-top:

| # | Layer | Purpose |
|---|-------|---------|
| 1 | `StaticTileLayer` | Non-animated terrain (grass, walls) |
| 2 | `AnimatedTileLayer` | Animated tiles (water, lava, swamp) |
| 3 | `ShadowLayer` | Time-of-day shadows |
| 4 | `GlowLayer` | Tile glow effects (lava, magic) |
| 5 | `FogOfWarLayer` | Visibility/exploration overlay |
| 6 | `PlayerLayer` | Player sprite + torch glow |
| 7 | `DayNightLayer` | Global time-of-day tint |
| 8 | `RainLayer` | Weather: rain drops |
| 9 | `FogLayer` | Weather: fog patches |
| 10 | `FireflyLayer` | Ambient: night/dusk fireflies |
| 11 | `VignetteLayer` | Screen-edge darkening |

## Graphics Draw Pattern

```typescript
<pixiGraphics
  draw={(g) => {
    g.clear();           // ALWAYS clear first
    g.rect(x, y, w, h);
    g.fill({ color: 0xffffff, alpha: 0.5 });
  }}
/>
```

**Rules**:
- `g.clear()` MUST be first
- Wrap draw in `useCallback` for performance
- Use `filters` prop for blur effects

## Text/Filter Memoization (CRITICAL)

```typescript
// DO: Create once, reuse
const SHARED_TEXT_STYLE = new TextStyle({
  fontFamily: 'Courier New, monospace',
  fontSize: TILE_SIZE,
  fill: 0xffffff,
});

const BLUR_FILTER = (() => {
  const filter = new BlurFilter({ strength: 8, quality: 2 });
  return [filter];
})();

// DON'T: Create inline (recreates every render)
<pixiText style={new TextStyle({ ... })} />  // BAD
```

## Animation Pattern

```typescript
const [animationTime, setAnimationTime] = useState(0);
const startTimeRef = useRef(0);

useEffect(() => {
  startTimeRef.current = Date.now();
}, []);

useTick(() => {
  setAnimationTime(Date.now() - startTimeRef.current);
});
```

Pass `animationTime` to all animated layers.

## Coordinate System

- **Tile coords**: `(x, y)` in map space (0 to MAP_WIDTH/HEIGHT)
- **Screen coords**: `(screenX, screenY)` in pixels
- **Conversion**: `screenX = (tileX - viewport.startX) * TILE_SIZE`

## Torch Flicker

```typescript
function getTorchFlicker(time: number) {
  const t1 = Math.sin(time * 0.0015) * 0.5 + 0.5;
  const t2 = Math.sin(time * 0.002 + 1.5) * 0.5 + 0.5;
  return t1 * 0.6 + t2 * 0.4; // Multi-frequency blend
}
```

## Visibility Hashing

```typescript
// gameStore.ts
visibilityHash: playerX * 10000 + playerY

// PixiViewport.tsx - FogOfWarLayer only re-renders on hash change
```

## Blur Filter Strengths

| Filter | Strength | Use |
|--------|----------|-----|
| Ambient | 25px | Soft torch outer glow |
| Torch | 12px | Bright torch core |
| Glow | 8px | Tile effects (lava) |
| Fog | 30px | Weather fog patches |
| Firefly | 4px | Subtle ambient |

## Complexity Hotspots (PixiViewport.tsx)

| Component | Lines | Complexity |
|-----------|-------|------------|
| TransitionLayer | 224-302 | 8-directional neighbor checking |
| ConnectedTileLayer | 308-379 | 16-state connection detection |
| OverlayLayer | 397-459 | Deterministic spatial hashing |
| GlowLayer | 560-580 | Multi-layer blur with phase pulsing |
| ShadowLayer | 603-650 | Time-of-day shadow casting |
| WeatherLayers | 716-829 | Rain/fog/firefly animations |

## useShallow Optimization

GameContainer uses Zustand's `useShallow` for selective state subscriptions:

```typescript
const { player, map, weather } = useGameStore(
  useShallow((state) => ({ player: state.player, map: state.map, weather: state.weather }))
);
```

Prevents re-renders when unrelated store fields change.

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| React DOM elements in PixiViewport | Pixi handles ALL visuals |
| Forget `g.clear()` in draw | Graphics accumulate |
| Inline TextStyle/BlurFilter | Recreated every render |
| Mix `<pixiText>` with `<Text>` | Inconsistent, breaks |
| Skip `extend()` call | JSX elements won't work |
| Direct layer imports | Layers are internal to PixiViewport |
