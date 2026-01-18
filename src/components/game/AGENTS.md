# AGENTS.md - src/components/game

**Generated**: 2026-01-18 | **Commit**: b1bdced | **Parent**: [../../AGENTS.md](../../AGENTS.md)

Pixi.js rendering layer. ALL visual game content rendered here via WebGL.

## Architecture

| File | Role | Lines |
|------|------|-------|
| `GameContainer.tsx` | React orchestrator: map init, keyboard/click handlers, Zustand subscriptions | 250+ |
| `PixiViewport.tsx` | Pixi Application + 21-layer scene graph | 1372 |
| `LightLayer.tsx` | Light source rendering with flicker (3 sub-layers) | — |
| `animationTime.ts` | Global animation time state (module-level singleton) | — |

## Pixi.js Setup (CRITICAL)

```typescript
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics, Text, Sprite, TextStyle, BlurFilter } from 'pixi.js';

extend({ Container, Graphics, Text, Sprite }); // MUST call before JSX
```

**JSX Element Naming**: Use lowercase prefix — `<pixiContainer>`, `<pixiGraphics>`, `<pixiText>`, `<pixiSprite>`.

## Layer Order (Z-Index)

Bottom-to-top rendering (21 layers):

| # | Layer | Purpose |
|---|-------|---------|
| 1 | TileLayer | Non-animated terrain (grass, walls) |
| 2 | AnimatedTileLayer | Animated tiles (water, lava, swamp) - 4 frames @ 250ms |
| 3 | FeatureLayer | Feature overlay (structures, objects) |
| 4 | TransitionLayer | Water-to-land edge transitions (8-direction) |
| 5 | ConnectedTileLayer | Connected tiles (roads, 16-state) |
| 6 | MultiTileObjectLayer | 2x2+ objects with animation |
| 7 | OverlayLayer | Decorative overlays (flowers, grass) - deterministic spatial hash |
| 8 | ShadowLayer | Time-of-day shadows |
| 9 | FogOfWarLayer | Visibility/exploration overlay |
| 10 | PlayerLayer | Player sprite |
| 11 | EnemyLayer | Dynamic enemy sprites |
| 12 | BossLayer | Scaled 1.5x boss sprite |
| 13 | HealthBarLayer | Graphics-based HP bars |
| 14 | DamageNumberLayer | Floating damage text |
| 15 | LightLayer | Light sources (3 sub-layers: glow + darkness + flicker) |
| 16 | DayNightLayer | Global time-of-day tint with night pulse |
| 17 | RainLayer | Weather: rain drops |
| 18 | FogLayer | Weather: fog patches |
| 19 | FireflyLayer | Ambient: night/dusk fireflies |
| 20 | AmbientDustLayer | Floating dust particles |
| 21 | VignetteLayer | Screen-edge darkening |

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
// DO: Module-level, created once (IIFE wrapped)
const FOG_BLUR_FILTER = (() => {
  const filter = new BlurFilter({ strength: 30, quality: 1 });
  return [filter];
})();

const SHARED_TEXT_STYLE = new TextStyle({
  fontFamily: 'Courier New, monospace',
  fontSize: TILE_SIZE,
  fill: 0xffffff,
});

// DON'T: Inline (recreates every render)
<pixiText style={new TextStyle({ ... })} />  // BAD
```

## Global Animation Time Pattern

```typescript
// animationTime.ts - Module-level singleton
let moduleAnimationTime = 0;
export const getAnimationTime = (): number => moduleAnimationTime;
export const setAnimationTime = (time: number): void => { moduleAnimationTime = time; };

// GameScene - Updates via useTick
useTick(() => {
  setAnimationTime(Date.now() - startTimeRef.current);
});

// Layers read directly
const frameIndex = Math.floor(getAnimationTime() / 250) % 4;
```

## Visibility Hashing

FogOfWarLayer memoization key:
```typescript
<FogOfWarLayer key={visibilityHash} ... />
// visibilityHash = playerX * 10000 + playerY
```

Forces remount on player move. Only re-renders when player position changes.

## Deterministic Spatial Hashing (Overlays)

```typescript
function positionHash(x: number, y: number): number {
  const hash = (x * 374761393 + y * 668265263) ^ (x * 1274126177);
  return ((hash & 0x7fffffff) % 1000) / 1000;
}
// Same tile always has same overlay across sessions
```

## Coordinate Conversion

```typescript
screenX = (tileX - viewport.startX) * TILE_SIZE
screenY = (tileY - viewport.startY) * TILE_SIZE
```

## Blur Filter Strengths

| Filter | Strength | Use |
|--------|----------|-----|
| Fog (weather) | 30px | Weather fog patches |
| Ambient light | 25px | Soft torch outer glow |
| Darkness | 24px | Cell-based darkness |
| Torch core | 12px | Bright torch center |
| Firefly | 4px | Subtle ambient |

## Texture Loading

```typescript
// Parallel loading on startup
const textureCache = new Map<string, Texture>();
export async function loadTileTextures(): Promise<void> {
  const loadPromises = urls.map(url => Assets.load(url));
  await Promise.all(loadPromises);
}
```

- 168 SVG imports, 43 tiles reuse 14 base SVGs (fallback chains)
- Single promise for deduplication (idempotent calls)
- Lazy initialization on first GameScene render

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new layer | `PixiViewport.tsx` → add after appropriate layer in render order |
| Modify layer behavior | Find layer in `PixiViewport.tsx` by name |
| Add light source | `utils/lighting.ts` → `LIGHT_SOURCE_PRESETS` |
| Change animation timing | `animationTime.ts` or frame calculation |
| Debug visibility | Check `visibilityHash` key on FogOfWarLayer |

## Anti-Patterns

| Forbidden | Why |
|-----------|-----|
| React DOM elements in PixiViewport | Pixi handles ALL visuals |
| Forget `g.clear()` in draw | Graphics accumulate |
| Inline TextStyle/BlurFilter | Recreated every render |
| `<Text>` instead of `<pixiText>` | Breaks JSX resolution |
| Skip `extend()` call | JSX elements won't work |
| Multiple `useTick` with different timing | Use global animationTime |
