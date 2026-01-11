import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics, Text, TextStyle, BlurFilter } from 'pixi.js';
import type { MapData, Position, ViewportBounds, TileType } from '../../types';
import type { WeatherType, TimeOfDay } from '../../stores/gameStore';
import type { LightSource } from '../../utils/lighting';
import { LightLayer } from './LightLayer';
import { ParticleLayer } from './ParticleLayer';
import { 
  TILE_GLYPHS, 
  PLAYER_GLYPH, 
  getGlyphAtTime, 
  isAnimatedTile,
  getStaticGlyph,
} from '../../utils/tileGlyphs';
import { applyColorWithCachedNoise } from '../../utils/colorNoiseCache';
import { TILE_SIZE, VIEWPORT_WIDTH_TILES, VIEWPORT_HEIGHT_TILES } from '../../utils/constants';

extend({ Container, Graphics, Text });

const FONT_FAMILY = 'Courier New, monospace';

const SHARED_TEXT_STYLE = new TextStyle({
  fontFamily: FONT_FAMILY,
  fontSize: TILE_SIZE,
  fill: 0xffffff,
});

const PLAYER_TEXT_STYLE = new TextStyle({
  fontFamily: FONT_FAMILY,
  fontSize: TILE_SIZE + 4,
  fill: PLAYER_GLYPH.fg,
  fontWeight: 'bold',
});







const FOG_BLUR_FILTER = (() => {
  const filter = new BlurFilter({ strength: 30, quality: 1 });
  return [filter];
})();

const FIREFLY_BLUR_FILTER = (() => {
  const filter = new BlurFilter({ strength: 4, quality: 1 });
  return [filter];
})();

interface PixiViewportProps {
  map: MapData;
  playerPosition: Position;
  viewport: ViewportBounds;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  visibilityHash: number;
  isTileVisible: (x: number, y: number) => boolean;
  isTileExplored: (x: number, y: number) => boolean;
  lightSources: LightSource[];
}

interface MapViewportProps {
  map: MapData;
  viewport: ViewportBounds;
}

interface ScreenSizeProps {
  width: number;
  height: number;
}

interface AnimatedProps {
  animationTime: number;
}

interface WeatherProps {
  weather: WeatherType;
}

interface TimeOfDayProps {
  timeOfDay: TimeOfDay;
}

type StaticTileLayerProps = MapViewportProps;

type AnimatedTileLayerProps = MapViewportProps & AnimatedProps;

type GlowLayerProps = MapViewportProps & AnimatedProps;

type ShadowLayerProps = MapViewportProps & TimeOfDayProps;

type VignetteLayerProps = ScreenSizeProps;

type RainLayerProps = ScreenSizeProps & AnimatedProps & WeatherProps;

type FogLayerProps = ScreenSizeProps & AnimatedProps & WeatherProps;

type FireflyLayerProps = ScreenSizeProps & AnimatedProps & TimeOfDayProps;

type DayNightLayerProps = ScreenSizeProps & AnimatedProps & TimeOfDayProps;

const StaticTileLayer = memo(function StaticTileLayer({ 
  map, 
  viewport,
}: StaticTileLayerProps) {
  const tiles = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;
        
        const layer = map.layers[0];
        if (!layer) continue;
        
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;
        
        const tileType = map.tileMapping[String(tileId)] as TileType;
        
        if (isAnimatedTile(tileType)) continue;
        
        const glyph = getStaticGlyph(tileType);
        const screenX = (x - viewport.startX) * TILE_SIZE;
        const screenY = (y - viewport.startY) * TILE_SIZE;
        const bgColor = applyColorWithCachedNoise(glyph.bg, x, y, 0.12);
        const fgColor = applyColorWithCachedNoise(glyph.fg, x, y, 0.08);
        const key = `${x}-${y}`;
        
        result.push(
          <pixiGraphics
            key={`bg-${key}`}
            draw={(g) => {
              g.clear();
              g.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
              g.fill(bgColor);
            }}
          />
        );
        
        if (glyph.detail) {
          const detailColor = applyColorWithCachedNoise(glyph.detail, x, y, 0.05);
          result.push(
            <pixiText
              key={`detail-${key}`}
              text={glyph.char}
              x={screenX + 1}
              y={screenY - 1}
              style={SHARED_TEXT_STYLE}
              tint={detailColor}
              alpha={0.3}
            />
          );
        }
        
        result.push(
          <pixiText
            key={`fg-${key}`}
            text={glyph.char}
            x={screenX}
            y={screenY}
            style={SHARED_TEXT_STYLE}
            tint={fgColor}
          />
        );
      }
    }
    return result;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY]);
  
  return <pixiContainer>{tiles}</pixiContainer>;
});

const AnimatedTileLayer = memo(function AnimatedTileLayer({
  map,
  viewport,
  animationTime,
}: AnimatedTileLayerProps) {
  const tiles: React.ReactNode[] = [];
  
  for (let y = viewport.startY; y < viewport.endY; y++) {
    for (let x = viewport.startX; x < viewport.endX; x++) {
      if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;
      
      const layer = map.layers[0];
      if (!layer) continue;
      
      const tileId = layer.data[y]?.[x];
      if (tileId === undefined) continue;
      
      const tileType = map.tileMapping[String(tileId)] as TileType;
      
      if (!isAnimatedTile(tileType)) continue;
      
      const glyphData = TILE_GLYPHS[tileType];
      const glyph = getGlyphAtTime(glyphData, animationTime, x, y);
      const screenX = (x - viewport.startX) * TILE_SIZE;
      const screenY = (y - viewport.startY) * TILE_SIZE;
      const bgColor = applyColorWithCachedNoise(glyph.bg, x, y, 0.12);
      const fgColor = applyColorWithCachedNoise(glyph.fg, x, y, 0.08);
      const key = `${x}-${y}-${glyph.char}`;
      
      tiles.push(
        <pixiGraphics
          key={`bg-${key}`}
          draw={(g) => {
            g.clear();
            g.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            g.fill(bgColor);
          }}
        />
      );
      
      if (glyph.detail) {
        const detailColor = applyColorWithCachedNoise(glyph.detail, x, y, 0.05);
        tiles.push(
          <pixiText
            key={`detail-${key}`}
            text={glyph.char}
            x={screenX + 1}
            y={screenY - 1}
            style={SHARED_TEXT_STYLE}
            tint={detailColor}
            alpha={0.3}
          />
        );
      }
      
      tiles.push(
        <pixiText
          key={`fg-${key}`}
          text={glyph.char}
          x={screenX}
          y={screenY}
          style={SHARED_TEXT_STYLE}
          tint={fgColor}
        />
      );
    }
  }
  
  return <pixiContainer>{tiles}</pixiContainer>;
});



interface PlayerLayerProps {
  playerPosition: Position;
  viewport: ViewportBounds;
}

const PlayerLayer = memo(function PlayerLayer({
  playerPosition,
  viewport,
}: PlayerLayerProps) {
  const screenX = (playerPosition.x - viewport.startX) * TILE_SIZE;
  const screenY = (playerPosition.y - viewport.startY) * TILE_SIZE;

  return (
    <pixiContainer>
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          g.fill({ color: 0x1a1a18, alpha: 1 });
        }}
      />
      <pixiText
        text={PLAYER_GLYPH.char}
        x={screenX}
        y={screenY - 2}
        style={PLAYER_TEXT_STYLE}
      />
    </pixiContainer>
  );
});

const GLOW_BLUR_OUTER = (() => {
  const filter = new BlurFilter({ strength: 16, quality: 2 });
  return [filter];
})();

const GLOW_BLUR_MID = (() => {
  const filter = new BlurFilter({ strength: 8, quality: 2 });
  return [filter];
})();

const GLOW_BLUR_INNER = (() => {
  const filter = new BlurFilter({ strength: 4, quality: 2 });
  return [filter];
})();

function useGlowDrawer(
  map: MapData,
  viewport: ViewportBounds,
  animationTime: number,
  radiusMultiplier: number,
  alphaMultiplier: number
) {
  return useCallback((g: Graphics) => {
    g.clear();
    
    const layer = map.layers[0];
    if (!layer) return;

    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;

        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;

        const tileType = map.tileMapping[String(tileId)] as TileType;
        const glyphData = TILE_GLYPHS[tileType] || TILE_GLYPHS.grass;
        const glyph = getGlyphAtTime(glyphData, animationTime, x, y);

        if (!glyph.glow) continue;

        const screenX = (x - viewport.startX) * TILE_SIZE;
        const screenY = (y - viewport.startY) * TILE_SIZE;
        const centerX = screenX + TILE_SIZE / 2;
        const centerY = screenY + TILE_SIZE / 2;

        const phaseOffset = (x * 7 + y * 13) * 0.1;
        const pulse = Math.sin(animationTime * 0.005 + phaseOffset) * 0.3 + 0.7;

        g.circle(centerX, centerY, TILE_SIZE * radiusMultiplier * pulse);
        g.fill({ color: glyph.glow, alpha: alphaMultiplier * pulse });
      }
    }
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY, animationTime, radiusMultiplier, alphaMultiplier]);
}

const GlowLayer = memo(function GlowLayer({
  map,
  viewport,
  animationTime,
}: GlowLayerProps) {
  const drawOuter = useGlowDrawer(map, viewport, animationTime, 3.0, 0.2);
  const drawMid = useGlowDrawer(map, viewport, animationTime, 2.0, 0.35);
  const drawInner = useGlowDrawer(map, viewport, animationTime, 1.2, 0.5);

  return (
    <pixiContainer>
      <pixiGraphics filters={GLOW_BLUR_OUTER} draw={drawOuter} />
      <pixiGraphics filters={GLOW_BLUR_MID} draw={drawMid} />
      <pixiGraphics filters={GLOW_BLUR_INNER} draw={drawInner} />
    </pixiContainer>
  );
});

const SHADOW_CASTING_TILES = new Set<TileType>(['mountain', 'wall', 'dungeon_wall', 'forest']);

interface ShadowDirection {
  dx: number;
  dy: number;
}

const SHADOW_DIRECTIONS: Record<TimeOfDay, ShadowDirection | null> = {
  dawn: { dx: 1, dy: 1 },
  day: { dx: 1, dy: 0 },
  dusk: { dx: -1, dy: 1 },
  night: null,
};

const SHADOW_ALPHA: Record<TimeOfDay, number> = {
  dawn: 0.25,
  day: 0.15,
  dusk: 0.25,
  night: 0,
};

const ShadowLayer = memo(function ShadowLayer({
  map,
  viewport,
  timeOfDay,
}: ShadowLayerProps) {
  const shadowDir = SHADOW_DIRECTIONS[timeOfDay];
  const shadowAlpha = SHADOW_ALPHA[timeOfDay];

  const drawShadows = useCallback((g: Graphics) => {
    g.clear();
    if (!shadowDir) return;

    const layer = map.layers[0];
    if (!layer) return;

    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;

        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;

        const tileType = map.tileMapping[String(tileId)] as TileType;
        if (!SHADOW_CASTING_TILES.has(tileType)) continue;

        const shadowX = x + shadowDir.dx;
        const shadowY = y + shadowDir.dy;

        if (shadowX < viewport.startX || shadowX >= viewport.endX ||
            shadowY < viewport.startY || shadowY >= viewport.endY) continue;

        const shadowTileId = layer.data[shadowY]?.[shadowX];
        if (shadowTileId === undefined) continue;
        const shadowTileType = map.tileMapping[String(shadowTileId)] as TileType;
        if (SHADOW_CASTING_TILES.has(shadowTileType)) continue;

        const screenX = (shadowX - viewport.startX) * TILE_SIZE;
        const screenY = (shadowY - viewport.startY) * TILE_SIZE;

        g.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        g.fill({ color: 0x000000, alpha: shadowAlpha });
      }
    }
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY, shadowDir, shadowAlpha]);

  if (!shadowDir) return null;
  return <pixiGraphics draw={drawShadows} />;
});

interface FogOfWarLayerProps {
  viewport: ViewportBounds;
  isTileVisible: (x: number, y: number) => boolean;
  isTileExplored: (x: number, y: number) => boolean;
}

const FogOfWarLayer = memo(function FogOfWarLayer({
  viewport,
  isTileVisible,
  isTileExplored,
}: FogOfWarLayerProps) {
  const drawFog = useCallback((g: Graphics) => {
    g.clear();

    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        const visible = isTileVisible(x, y);
        if (visible) continue;

        const explored = isTileExplored(x, y);
        const alpha = explored ? 0.25 : 0.75;
        const screenX = (x - viewport.startX) * TILE_SIZE;
        const screenY = (y - viewport.startY) * TILE_SIZE;

        g.rect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        g.fill({ color: 0x000000, alpha });
      }
    }
  }, [viewport.startX, viewport.startY, viewport.endX, viewport.endY, isTileVisible, isTileExplored]);

  return <pixiGraphics draw={drawFog} />;
});

const VignetteLayer = memo(function VignetteLayer({ width, height }: VignetteLayerProps) {
  const edgeWidth = Math.min(width, height) * 0.25;
  
  const drawVignette = useCallback((g: Graphics) => {
    g.clear();
    
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = 1 - i / steps;
      const alpha = 0.5 * t * t;
      const offset = edgeWidth * (i / steps);
      
      g.rect(0, offset, offset, height - offset * 2);
      g.fill({ color: 0x000000, alpha });
      
      g.rect(width - offset, offset, offset, height - offset * 2);
      g.fill({ color: 0x000000, alpha });
      
      g.rect(0, 0, width, offset);
      g.fill({ color: 0x000000, alpha });
      
      g.rect(0, height - offset, width, offset);
      g.fill({ color: 0x000000, alpha });
    }
  }, [width, height, edgeWidth]);
  
  return <pixiGraphics draw={drawVignette} />;
});

const RAIN_DENSITY = 80;

const RainLayer = memo(function RainLayer({
  width,
  height,
  animationTime,
  weather,
}: RainLayerProps) {
  const drawRain = useCallback((g: Graphics) => {
    g.clear();
    
    g.rect(0, 0, width, height);
    g.fill({ color: 0x223344, alpha: 0.15 });

    const seed = 12345;
    for (let i = 0; i < RAIN_DENSITY; i++) {
      const hash = (seed * (i + 1) * 16807) % 2147483647;
      const baseX = hash % width;
      const speed = 150 + (hash % 100);
      const offset = (hash >> 8) % 1000;

      const y = ((animationTime * speed / 1000 + offset) % (height + 40)) - 20;
      const x = baseX + Math.sin(animationTime * 0.002 + i) * 3;
      const alpha = 0.4 + (hash % 30) / 100;
      const length = 6 + (hash % 4);

      g.moveTo(x, y);
      g.lineTo(x + 1, y + length);
      g.stroke({ color: 0x6688aa, alpha, width: 1 });
    }
  }, [width, height, animationTime]);

  if (weather !== 'rain') return null;

  return <pixiGraphics draw={drawRain} />;
});

const FOG_PATCH_COUNT = 12;

const FogLayer = memo(function FogLayer({
  width,
  height,
  animationTime,
  weather,
}: FogLayerProps) {
  const drawFog = useCallback((g: Graphics) => {
    g.clear();
    
    g.rect(0, 0, width, height);
    g.fill({ color: 0x667788, alpha: 0.25 });

    const seed = 54321;
    for (let i = 0; i < FOG_PATCH_COUNT; i++) {
      const hash = (seed * (i + 1) * 16807) % 2147483647;
      const baseX = (hash % (width + 200)) - 100;
      const baseY = ((hash >> 10) % (height + 100)) - 50;
      const patchWidth = 150 + (hash % 200);
      const patchHeight = 80 + ((hash >> 5) % 60);
      const speed = 8 + (hash % 15);
      const phaseOffset = (hash >> 15) % 1000;

      const x = baseX + Math.sin((animationTime + phaseOffset) * 0.0005 * speed) * 50;
      const y = baseY + Math.cos((animationTime + phaseOffset) * 0.0003 * speed) * 20;
      const alpha = 0.15 + Math.sin((animationTime + phaseOffset) * 0.001) * 0.05;

      g.ellipse(x + patchWidth / 2, y + patchHeight / 2, patchWidth / 2, patchHeight / 2);
      g.fill({ color: 0x889999, alpha });
    }
  }, [width, height, animationTime]);

  if (weather !== 'fog') return null;

  return <pixiGraphics filters={FOG_BLUR_FILTER} draw={drawFog} />;
});

const FIREFLY_COUNT = 25;

const FireflyLayer = memo(function FireflyLayer({
  width,
  height,
  animationTime,
  timeOfDay,
}: FireflyLayerProps) {
  const drawFireflies = useCallback((g: Graphics) => {
    g.clear();
    
    const seed = 98765;
    const color = timeOfDay === 'night' ? 0xaaffaa : 0xffddaa;

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const hash = (seed * (i + 1) * 16807) % 2147483647;
      const baseX = hash % width;
      const baseY = (hash >> 10) % height;
      const speedX = 0.02 + ((hash >> 5) % 30) / 1000;
      const speedY = 0.015 + ((hash >> 8) % 20) / 1000;
      const phaseX = (hash >> 12) % 1000;
      const phaseY = (hash >> 15) % 1000;
      const blinkSpeed = 0.002 + ((hash >> 18) % 20) / 10000;
      const blinkPhase = (hash >> 20) % 1000;

      const x = baseX + Math.sin((animationTime + phaseX) * speedX) * 60;
      const y = baseY + Math.cos((animationTime + phaseY) * speedY) * 40;
      const blink = Math.sin((animationTime + blinkPhase) * blinkSpeed);
      const alpha = blink > 0.3 ? (blink - 0.3) * 1.4 : 0;

      if (alpha > 0) {
        g.circle(x, y, 3);
        g.fill({ color, alpha: alpha * 0.8 });
      }
    }
  }, [width, height, animationTime, timeOfDay]);

  if (timeOfDay !== 'night' && timeOfDay !== 'dusk') return null;

  return <pixiGraphics filters={FIREFLY_BLUR_FILTER} draw={drawFireflies} />;
});

const DUST_COUNT = 40;

const DUST_BLUR_FILTER = (() => {
  const filter = new BlurFilter({ strength: 2, quality: 1 });
  return [filter];
})();

interface AmbientDustLayerProps extends ScreenSizeProps {
  animationTime: number;
  timeOfDay: TimeOfDay;
}

const AmbientDustLayer = memo(function AmbientDustLayer({
  width,
  height,
  animationTime,
  timeOfDay,
}: AmbientDustLayerProps) {
  const dustColor = timeOfDay === 'dawn' ? 0xffddaa 
    : timeOfDay === 'dusk' ? 0xffccaa 
    : timeOfDay === 'night' ? 0x8899aa 
    : 0xeeeecc;
  
  const drawDust = useCallback((g: Graphics) => {
    g.clear();
    
    const seed = 11111;
    
    for (let i = 0; i < DUST_COUNT; i++) {
      const hash = (seed * (i + 1) * 16807) % 2147483647;
      const baseX = hash % width;
      const baseY = (hash >> 10) % height;
      const driftSpeedX = 0.008 + ((hash >> 5) % 10) / 1000;
      const driftSpeedY = 0.005 + ((hash >> 8) % 8) / 1000;
      const phaseX = (hash >> 12) % 1000;
      const phaseY = (hash >> 15) % 1000;
      const floatSpeed = 0.001 + ((hash >> 18) % 10) / 10000;
      const floatPhase = (hash >> 20) % 1000;
      const size = 1 + ((hash >> 22) % 10) / 10;
      
      const x = baseX + Math.sin((animationTime + phaseX) * driftSpeedX) * 80;
      const y = baseY + Math.cos((animationTime + phaseY) * driftSpeedY) * 60 
        + Math.sin((animationTime + floatPhase) * floatSpeed) * 20;
      
      const twinkle = Math.sin((animationTime + floatPhase) * 0.003) * 0.5 + 0.5;
      const alpha = 0.1 + twinkle * 0.15;
      
      g.circle(x, y, size);
      g.fill({ color: dustColor, alpha });
    }
  }, [width, height, animationTime, dustColor]);

  return <pixiGraphics filters={DUST_BLUR_FILTER} draw={drawDust} />;
});

const TIME_OF_DAY_TINTS: Record<TimeOfDay, { color: number; alpha: number }> = {
  dawn: { color: 0xff8866, alpha: 0.15 },
  day: { color: 0x000000, alpha: 0 },
  dusk: { color: 0xff6644, alpha: 0.2 },
  night: { color: 0x112244, alpha: 0.30 },
};

const DayNightLayer = memo(function DayNightLayer({
  width,
  height,
  timeOfDay,
  animationTime,
}: DayNightLayerProps) {
  const tint = TIME_OF_DAY_TINTS[timeOfDay];
  
  if (tint.alpha === 0) return null;

  const pulse = timeOfDay === 'night' 
    ? Math.sin(animationTime * 0.0005) * 0.03 
    : 0;

  return (
    <pixiGraphics
      draw={(g) => {
        g.clear();
        g.rect(0, 0, width, height);
        g.fill({ color: tint.color, alpha: tint.alpha + pulse });
      }}
    />
  );
});

interface GameSceneProps extends Omit<PixiViewportProps, 'animationTime'> {
  width: number;
  height: number;
  lightSources: LightSource[];
}

function GameScene({
  map,
  playerPosition,
  viewport,
  weather,
  timeOfDay,
  isTileVisible,
  isTileExplored,
  width,
  height,
  lightSources,
}: GameSceneProps) {
  const [animationTime, setAnimationTime] = useState(0);
  const startTimeRef = useRef(0);
  
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);
  
  useTick(() => {
    if (startTimeRef.current === 0) return;
    const now = Date.now();
    setAnimationTime(now - startTimeRef.current);
  });

  return (
    <pixiContainer>
      <StaticTileLayer map={map} viewport={viewport} />
      <AnimatedTileLayer map={map} viewport={viewport} animationTime={animationTime} />
      <ShadowLayer map={map} viewport={viewport} timeOfDay={timeOfDay} />
      <GlowLayer map={map} viewport={viewport} animationTime={animationTime} />
      <FogOfWarLayer 
        viewport={viewport} 
        isTileVisible={isTileVisible} 
        isTileExplored={isTileExplored} 
      />
      <PlayerLayer 
        playerPosition={playerPosition} 
        viewport={viewport}
      />
      <LightLayer 
        lights={lightSources} 
        viewport={viewport} 
        animationTime={animationTime}
        playerPosition={playerPosition}
      />
      <ParticleLayer map={map} viewport={viewport} animationTime={animationTime} />
      <DayNightLayer width={width} height={height} timeOfDay={timeOfDay} animationTime={animationTime} />
      <RainLayer width={width} height={height} animationTime={animationTime} weather={weather} />
      <FogLayer width={width} height={height} animationTime={animationTime} weather={weather} />
      <FireflyLayer width={width} height={height} animationTime={animationTime} timeOfDay={timeOfDay} />
      <AmbientDustLayer width={width} height={height} animationTime={animationTime} timeOfDay={timeOfDay} />
      <VignetteLayer width={width} height={height} />
    </pixiContainer>
  );
}

export function PixiViewport({
  map,
  playerPosition,
  viewport,
  weather,
  timeOfDay,
  visibilityHash,
  isTileVisible,
  isTileExplored,
  lightSources,
}: PixiViewportProps) {
  const width = VIEWPORT_WIDTH_TILES * TILE_SIZE;
  const height = VIEWPORT_HEIGHT_TILES * TILE_SIZE;

  return (
    <Application
      width={width}
      height={height}
      backgroundColor={0x111111}
      antialias={false}
      resolution={window.devicePixelRatio || 1}
      autoDensity={true}
    >
      <GameScene
        map={map}
        playerPosition={playerPosition}
        viewport={viewport}
        weather={weather}
        timeOfDay={timeOfDay}
        visibilityHash={visibilityHash}
        isTileVisible={isTileVisible}
        isTileExplored={isTileExplored}
        width={width}
        height={height}
        lightSources={lightSources}
      />
    </Application>
  );
}
