# AGENTS.md - src/components/game

**Generated**: 2026-01-16 | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Pixi.js rendering layer. ALL visual game content rendered here via WebGL.

## Architecture

| File | Role |
|------|------|
| `GameContainer.tsx` | React orchestrator: map init, keyboard/click handlers, Zustand subscriptions |
| `PixiViewport.tsx` | Pixi Application + 16-layer scene graph (991 lines) |
| `LightLayer.tsx` | Light source rendering with flicker (3 sub-layers) |
| `animationTime.ts` | Global animation time state |

## Pixi.js Setup (CRITICAL)

```typescript
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics, Text, Sprite, TextStyle, BlurFilter } from 'pixi.js';

extend({ Container, Graphics, Text, Sprite }); // MUST call before JSX
```

**JSX Element Naming**: Use lowercase prefix — `<pixiContainer>`, `<pixiGraphics>`, `<pixiText>`, `<pixiSprite>`.

## Layer Order (Z-Index)

Bottom-to-top rendering:

| # | Layer | Purpose |
|---|-------|---------|
| 1 | TileLayer | Non-animated terrain (grass, walls) |
| 2 | AnimatedTileLayer | Animated tiles (water, lava, swamp) |
| 3 | FeatureLayer | Feature overlay (structures, objects) |
| 4 | TransitionLayer | Water-to-land edge transitions (8-direction) |
| 5 | ConnectedTileLayer | Connected tiles (roads, 16-state) |
| 6 | OverlayLayer | Decorative overlays (flowers, grass) |
| 7 | ShadowLayer | Time-of-day shadows |
| 8 | FogOfWarLayer | Visibility/exploration overlay |
| 9 | PlayerLayer | Player sprite |
| 10 | LightLayer | Light sources (torches, player torch, 3 sub-layers) |
| 11 | DayNightLayer | Global time-of-day tint |
| 12 | RainLayer | Weather: rain drops |
| 13 | FogLayer | Weather: fog patches |
| 14 | FireflyLayer | Ambient: night/dusk fireflies |
| 15 | AmbientDustLayer | Floating dust particles |
| 16 | VignetteLayer | Screen-edge darkening |

## Graphics Draw Pattern

```typescript
<pixiGraphics
  draw={useCallback((g) => {
    g.clear();           // ALWAYS first
    g.rect(x, y, w, h);
    g.fill({ color: 0xffffff, alpha: 0.5 });
  }, [dependencies])}
/>
```

**Rules**: `g.clear()` MUST be first. Wrap in `useCallback`.

## Filter/Style Memoization (CRITICAL)

```typescript
// DO: Module-level, created once
const SHARED_TEXT_STYLE = new TextStyle({
  fontFamily: 'Courier New, monospace',
  fontSize: TILE_SIZE,
  fill: 0xffffff,
});

const BLUR_FILTER = (() => {
  const filter = new BlurFilter({ strength: 8, quality: 2 });
  return [filter];
})();

// DON'T: Inline (recreates every render)
<pixiText style={new TextStyle({ ... })} />  // BAD
```

## Animation Pattern

```typescript
const [animationTime, setAnimationTime] = useState(0);
const startTimeRef = useRef(0);

useEffect(() => { startTimeRef.current = Date.now(); }, []);

useTick(() => {
  setAnimationTime(Date.now() - startTimeRef.current);
});
```

## Visibility Hashing

FogOfWarLayer memoization key:
```typescript
visibilityHash: playerX * 10000 + playerY
```

Only re-renders on player position change.

## Coordinate Conversion

```typescript
screenX = (tileX - viewport.startX) * TILE_SIZE
screenY = (tileY - viewport.startY) * TILE_SIZE
```

## Blur Filter Strengths

| Filter | Strength | Use |
|--------|----------|-----|
| Ambient light | 25px | Soft torch outer glow |
| Torch core | 12px | Bright torch center |
| Fog | 30px | Weather fog patches |
| Firefly | 4px | Subtle ambient |

## Complexity Hotspots

| Component | Lines | Complexity |
|-----------|-------|------------|
| TransitionLayer | 80 | 8-directional neighbor checking |
| ConnectedTileLayer | 71 | 16-state connection detection |
| OverlayLayer | 62 | Deterministic spatial hashing |
| ShadowLayer | 50 | Time-of-day shadow casting |
| WeatherLayers | 110 | Rain/fog/firefly animations |

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| React DOM elements in PixiViewport | Pixi handles ALL visuals |
| Forget `g.clear()` in draw | Graphics accumulate |
| Inline TextStyle/BlurFilter | Recreated every render |
| `<Text>` instead of `<pixiText>` | Breaks JSX resolution |
| Skip `extend()` call | JSX elements won't work |
