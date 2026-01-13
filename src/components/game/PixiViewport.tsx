import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics, Text, BlurFilter, Sprite } from 'pixi.js';
import type { MapData, Position, ViewportBounds, TileType, TilePosition } from '../../types';
import type { WeatherType, TimeOfDay } from '../../stores/gameStore';
import type { LightSource } from '../../utils/lighting';
import type { MultiTileObject } from '../../dungeon/types';
import { LightLayer } from './LightLayer';

import { TILE_SIZE, VIEWPORT_WIDTH_TILES, VIEWPORT_HEIGHT_TILES } from '../../utils/constants';
import { 
  getBaseTileTexture, 
  loadTileTextures,
  getTransitionTexture,
  getTransitionDirections,
  getConnectedTileTexture,
  getConnectionType,
  getOverlayTexture,
  isAnimatedTile,
  getAnimatedTileTextures,
  getPlayerTexture,
  selectTileVariantTexture,
  getMultiTileTexture,
  isAnimatedMultiTile,
  getAnimatedMultiTileTextures,
  type TransitionDirection,
  type MultiTileObjectType,
} from '../../utils/tileTextures';
import {
  selectOverlay,
  shouldSpawnOverlay,
  type OverlayId,
} from '../../utils/overlayConfig';
import { getAnimationTime, setAnimationTime } from './animationTime';

extend({ Container, Graphics, Text, Sprite });

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
  multiTileObjects?: MultiTileObject[];
}

interface MapViewportProps {
  map: MapData;
  viewport: ViewportBounds;
}

interface ScreenSizeProps {
  width: number;
  height: number;
}

interface WeatherProps {
  weather: WeatherType;
}

interface TimeOfDayProps {
  timeOfDay: TimeOfDay;
}

interface TexturesReadyProps {
  texturesReady: boolean;
}



type ShadowLayerProps = MapViewportProps & TimeOfDayProps;

type VignetteLayerProps = ScreenSizeProps;

type RainLayerProps = ScreenSizeProps & WeatherProps;

type FogLayerProps = ScreenSizeProps & WeatherProps;

type FireflyLayerProps = ScreenSizeProps & TimeOfDayProps;

type DayNightLayerProps = ScreenSizeProps & TimeOfDayProps;



const TileLayer = memo(function TileLayer({ 
  map, 
  viewport,
}: MapViewportProps) {
  
  const tilePositions = useMemo(() => {
    const positions: TilePosition[] = [];
    const layer = map.layers[0];
    if (!layer) return positions;
    
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;
        
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;
        
        const tileType = map.tileMapping[String(tileId)] as TileType;
        if (isAnimatedTile(tileType)) continue;
        positions.push({ x, y, tileType });
      }
    }
    return positions;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY]);

  const tileElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    for (const { x, y, tileType } of tilePositions) {
      const screenX = (x - viewport.startX) * TILE_SIZE;
      const screenY = (y - viewport.startY) * TILE_SIZE;
      const key = `${x}-${y}`;
      
      const texture = tileType === 'dungeon_floor'
        ? selectTileVariantTexture(tileType, x, y)
        : getBaseTileTexture(tileType);
      if (texture) {
        elements.push(
          <pixiSprite
            key={key}
            texture={texture}
            x={screenX}
            y={screenY}
            width={TILE_SIZE}
            height={TILE_SIZE}
          />
        );
      }
    }
    return elements;
  }, [tilePositions, viewport.startX, viewport.startY]);
  
  return <pixiContainer>{tileElements}</pixiContainer>;
});

const ANIMATION_FRAME_INTERVAL = 250;
const ANIMATION_FRAME_COUNT = 4;

const AnimatedTileLayer = memo(function AnimatedTileLayer({ 
  map, 
  viewport,
}: MapViewportProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  
  useTick(() => {
    const newFrameIndex = Math.floor(getAnimationTime() / ANIMATION_FRAME_INTERVAL) % ANIMATION_FRAME_COUNT;
    if (newFrameIndex !== frameIndex) {
      setFrameIndex(newFrameIndex);
    }
  });
  
  const animatedTilePositions = useMemo(() => {
    const positions: TilePosition[] = [];
    const layer = map.layers[0];
    if (!layer) return positions;
    
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;
        
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;
        
        const tileType = map.tileMapping[String(tileId)] as TileType;
        if (!isAnimatedTile(tileType)) continue;
        positions.push({ x, y, tileType });
      }
    }
    return positions;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY]);

  const tileElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    for (const { x, y, tileType } of animatedTilePositions) {
      const screenX = (x - viewport.startX) * TILE_SIZE;
      const screenY = (y - viewport.startY) * TILE_SIZE;
      const key = `animated-${x}-${y}`;
      
      const textures = getAnimatedTileTextures(tileType);
      const texture = textures?.[frameIndex % textures.length];
      if (texture) {
        elements.push(
          <pixiSprite
            key={key}
            texture={texture}
            x={screenX}
            y={screenY}
            width={TILE_SIZE}
            height={TILE_SIZE}
          />
        );
      }
    }
    return elements;
  }, [animatedTilePositions, viewport.startX, viewport.startY, frameIndex]);
  
  if (animatedTilePositions.length === 0) return null;
  
  return <pixiContainer>{tileElements}</pixiContainer>;
});

const NO_FEATURE = 0;



const FeatureLayer = memo(function FeatureLayer({
  map,
  viewport,
}: MapViewportProps) {

  const featureTilePositions = useMemo(() => {
    const positions: TilePosition[] = [];
    const featureLayer = map.layers[1];
    if (!featureLayer) return positions;

    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;

        const featureId = featureLayer.data[y]?.[x];
        if (featureId === undefined || featureId === NO_FEATURE) continue;

        const tileType = map.tileMapping[String(featureId)] as TileType;
        positions.push({ x, y, tileType });
      }
    }
    return positions;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY]);

  const featureElements = useMemo(() => {
    const elements: React.ReactNode[] = [];

    for (const { x, y, tileType } of featureTilePositions) {
      const screenX = (x - viewport.startX) * TILE_SIZE;
      const screenY = (y - viewport.startY) * TILE_SIZE;
      const key = `feature-${x}-${y}`;

      const texture = getBaseTileTexture(tileType);
      if (texture) {
        elements.push(
          <pixiSprite
            key={key}
            texture={texture}
            x={screenX}
            y={screenY}
            width={TILE_SIZE}
            height={TILE_SIZE}
          />
        );
      }
    }
    return elements;
  }, [featureTilePositions, viewport.startX, viewport.startY]);

  if (featureTilePositions.length === 0) return null;

  return <pixiContainer>{featureElements}</pixiContainer>;
});

const WATER_TILES = new Set<TileType>(['water', 'shallow_water', 'deep_water']);

interface TransitionData {
  x: number;
  y: number;
  directions: TransitionDirection[];
}

const TransitionLayer = memo(function TransitionLayer({
  map,
  viewport,
  texturesReady,
}: MapViewportProps & TexturesReadyProps) {
  
  const getTileTypeAt = useCallback((x: number, y: number): TileType | null => {
    const layer = map.layers[0];
    if (!layer) return null;
    if (y < 0 || y >= map.height || x < 0 || x >= map.width) return null;
    
    const tileId = layer.data[y]?.[x];
    if (tileId === undefined) return null;
    
    return map.tileMapping[String(tileId)] as TileType;
  }, [map]);
  
  const transitionData = useMemo(() => {
    const data: TransitionData[] = [];
    if (!texturesReady) return data;
    
    const layer = map.layers[0];
    if (!layer) return data;
    
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        const tileType = getTileTypeAt(x, y);
        if (!tileType || !WATER_TILES.has(tileType)) continue;
        
        const neighbors = {
          n: getTileTypeAt(x, y - 1),
          s: getTileTypeAt(x, y + 1),
          e: getTileTypeAt(x + 1, y),
          w: getTileTypeAt(x - 1, y),
          ne: getTileTypeAt(x + 1, y - 1),
          nw: getTileTypeAt(x - 1, y - 1),
          se: getTileTypeAt(x + 1, y + 1),
          sw: getTileTypeAt(x - 1, y + 1),
        };
        
        const directions = getTransitionDirections(neighbors);
        if (directions.length > 0) {
          data.push({ x, y, directions });
        }
      }
    }
    return data;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY, texturesReady, getTileTypeAt]);

  const transitionElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    for (const { x, y, directions } of transitionData) {
      const screenX = (x - viewport.startX) * TILE_SIZE;
      const screenY = (y - viewport.startY) * TILE_SIZE;
      
      for (const direction of directions) {
        const texture = getTransitionTexture('water', 'grass', direction);
        if (texture) {
          elements.push(
            <pixiSprite
              key={`trans-${x}-${y}-${direction}`}
              texture={texture}
              x={screenX}
              y={screenY}
              width={TILE_SIZE}
              height={TILE_SIZE}
            />
          );
        }
      }
    }
    return elements;
  }, [transitionData, viewport.startX, viewport.startY]);

  if (!texturesReady || transitionData.length === 0) return null;
  
  return <pixiContainer>{transitionElements}</pixiContainer>;
});

interface ConnectedTileData extends TilePosition {
  connectionType: ReturnType<typeof getConnectionType>;
}

const ConnectedTileLayer = memo(function ConnectedTileLayer({
  map,
  viewport,
  texturesReady,
}: MapViewportProps & TexturesReadyProps) {
  
  const getTileAt = useCallback((tx: number, ty: number): TileType | null => {
    const layer = map.layers[0];
    if (!layer) return null;
    if (ty < 0 || ty >= map.height || tx < 0 || tx >= map.width) return null;
    const id = layer.data[ty]?.[tx];
    if (id === undefined) return null;
    return map.tileMapping[String(id)] as TileType;
  }, [map]);
  
  const connectedTileData = useMemo(() => {
    const data: ConnectedTileData[] = [];
    if (!texturesReady) return data;
    
    const layer = map.layers[0];
    if (!layer) return data;
    
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;
        
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;
        
        const tileType = map.tileMapping[String(tileId)] as TileType;
        if (tileType !== 'road' && tileType !== 'dungeon_wall' && tileType !== 'collapse_void') continue;
        
        const isConnectedNeighbor = (neighborType: TileType | null): boolean => {
          if (tileType === 'collapse_void') {
            return neighborType === 'collapse_void';
          }
          return neighborType === tileType;
        };
        
        const neighbors = {
          n: isConnectedNeighbor(getTileAt(x, y - 1)),
          s: isConnectedNeighbor(getTileAt(x, y + 1)),
          e: isConnectedNeighbor(getTileAt(x + 1, y)),
          w: isConnectedNeighbor(getTileAt(x - 1, y)),
        };
        
        const connectionType = getConnectionType(neighbors);
        data.push({ x, y, tileType, connectionType });
      }
    }
    return data;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY, texturesReady, getTileAt]);

  const connectedElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    for (const { x, y, tileType, connectionType } of connectedTileData) {
      const screenX = (x - viewport.startX) * TILE_SIZE;
      const screenY = (y - viewport.startY) * TILE_SIZE;
      
      const texture = getConnectedTileTexture(tileType, connectionType);
      if (texture) {
        elements.push(
          <pixiSprite
            key={`conn-${x}-${y}`}
            texture={texture}
            x={screenX}
            y={screenY}
            width={TILE_SIZE}
            height={TILE_SIZE}
          />
        );
      }
    }
    return elements;
  }, [connectedTileData, viewport.startX, viewport.startY]);

  if (!texturesReady || connectedTileData.length === 0) return null;
  
  return <pixiContainer>{connectedElements}</pixiContainer>;
});

interface MultiTileLayerProps {
  multiTileObjects: MultiTileObject[];
  viewport: ViewportBounds;
  texturesReady: boolean;
}

interface MultiTileSpriteData {
  key: string;
  objectType: MultiTileObjectType;
  tileX: number;
  tileY: number;
  screenX: number;
  screenY: number;
}

const MultiTileObjectLayer = memo(function MultiTileObjectLayer({
  multiTileObjects,
  viewport,
  texturesReady,
}: MultiTileLayerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  
  useTick(() => {
    const newFrameIndex = Math.floor(getAnimationTime() / ANIMATION_FRAME_INTERVAL) % ANIMATION_FRAME_COUNT;
    if (newFrameIndex !== frameIndex) {
      setFrameIndex(newFrameIndex);
    }
  });
  
  const spriteData = useMemo(() => {
    if (!texturesReady || multiTileObjects.length === 0) return [];
    
    const data: MultiTileSpriteData[] = [];
    
    for (const obj of multiTileObjects) {
      for (let dy = 0; dy < obj.height; dy++) {
        for (let dx = 0; dx < obj.width; dx++) {
          const worldX = obj.x + dx;
          const worldY = obj.y + dy;
          
          if (worldX < viewport.startX || worldX >= viewport.endX) continue;
          if (worldY < viewport.startY || worldY >= viewport.endY) continue;
          
          data.push({
            key: `multitile-${obj.id}-${dx}-${dy}`,
            objectType: obj.type as MultiTileObjectType,
            tileX: dx,
            tileY: dy,
            screenX: (worldX - viewport.startX) * TILE_SIZE,
            screenY: (worldY - viewport.startY) * TILE_SIZE,
          });
        }
      }
    }
    
    return data;
  }, [multiTileObjects, viewport.startX, viewport.startY, viewport.endX, viewport.endY, texturesReady]);
  
  const elements = useMemo(() => {
    const result: React.ReactNode[] = [];
    
    for (const { key, objectType, tileX, tileY, screenX, screenY } of spriteData) {
      let texture = null;
      
      if (isAnimatedMultiTile(objectType)) {
        const textures = getAnimatedMultiTileTextures(objectType, tileX, tileY);
        texture = textures?.[frameIndex % textures.length] ?? null;
      } else {
        texture = getMultiTileTexture(objectType, tileX, tileY);
      }
      
      if (texture) {
        result.push(
          <pixiSprite
            key={key}
            texture={texture}
            x={screenX}
            y={screenY}
            width={TILE_SIZE}
            height={TILE_SIZE}
          />
        );
      }
    }
    
    return result;
  }, [spriteData, frameIndex]);
  
  if (!texturesReady || spriteData.length === 0) return null;
  
  return <pixiContainer>{elements}</pixiContainer>;
});

function positionHash(x: number, y: number): number {
  const hash = (x * 374761393 + y * 668265263) ^ (x * 1274126177);
  return ((hash & 0x7fffffff) % 1000) / 1000;
}

interface OverlayData {
  x: number;
  y: number;
  overlayType: OverlayId;
}

const OverlayLayer = memo(function OverlayLayer({
  map,
  viewport,
  texturesReady,
}: MapViewportProps & TexturesReadyProps) {
  
  const overlayData = useMemo(() => {
    const data: OverlayData[] = [];
    if (!texturesReady) return data;
    
    const layer = map.layers[0];
    if (!layer) return data;
    
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;
        
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;
        
        const tileType = map.tileMapping[String(tileId)] as TileType;
        
        const spawnRand = positionHash(x, y);
        if (!shouldSpawnOverlay(tileType, spawnRand)) continue;
        
        const selectRand = positionHash(x + 1000, y + 1000);
        const overlayType = selectOverlay(tileType, selectRand);
        if (overlayType) {
          data.push({ x, y, overlayType });
        }
      }
    }
    return data;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY, texturesReady]);

  const overlayElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    for (const { x, y, overlayType } of overlayData) {
      const screenX = (x - viewport.startX) * TILE_SIZE;
      const screenY = (y - viewport.startY) * TILE_SIZE;
      
      const texture = getOverlayTexture(overlayType);
      if (texture) {
        elements.push(
          <pixiSprite
            key={`overlay-${x}-${y}`}
            texture={texture}
            x={screenX}
            y={screenY}
            width={TILE_SIZE}
            height={TILE_SIZE}
          />
        );
      }
    }
    return elements;
  }, [overlayData, viewport.startX, viewport.startY]);

  if (!texturesReady || overlayData.length === 0) return null;
  
  return <pixiContainer>{overlayElements}</pixiContainer>;
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
  const playerTexture = getPlayerTexture();

  if (!playerTexture) {
    return null;
  }

  return (
    <pixiSprite
      texture={playerTexture}
      x={screenX}
      y={screenY}
      width={TILE_SIZE}
      height={TILE_SIZE}
    />
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
        const alpha = explored ? 0.1 : 0.75;
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
  weather,
}: RainLayerProps) {
  const drawRain = useCallback((g: Graphics) => {
    g.clear();
    const animationTime = getAnimationTime();
    
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
  }, [width, height]);

  if (weather !== 'rain') return null;

  return <pixiGraphics draw={drawRain} />;
});

const FOG_PATCH_COUNT = 12;

const FogLayer = memo(function FogLayer({
  width,
  height,
  weather,
}: FogLayerProps) {
  const drawFog = useCallback((g: Graphics) => {
    g.clear();
    const animationTime = getAnimationTime();
    
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
  }, [width, height]);

  if (weather !== 'fog') return null;

  return <pixiGraphics filters={FOG_BLUR_FILTER} draw={drawFog} />;
});

const FIREFLY_COUNT = 25;

const FireflyLayer = memo(function FireflyLayer({
  width,
  height,
  timeOfDay,
}: FireflyLayerProps) {
  const drawFireflies = useCallback((g: Graphics) => {
    g.clear();
    const animationTime = getAnimationTime();
    
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
  }, [width, height, timeOfDay]);

  if (timeOfDay !== 'night' && timeOfDay !== 'dusk') return null;

  return <pixiGraphics filters={FIREFLY_BLUR_FILTER} draw={drawFireflies} />;
});

const DUST_COUNT = 40;

const DUST_BLUR_FILTER = (() => {
  const filter = new BlurFilter({ strength: 2, quality: 1 });
  return [filter];
})();

type AmbientDustLayerProps = ScreenSizeProps & TimeOfDayProps;

const AmbientDustLayer = memo(function AmbientDustLayer({
  width,
  height,
  timeOfDay,
}: AmbientDustLayerProps) {
  const dustColor = timeOfDay === 'dawn' ? 0xffddaa 
    : timeOfDay === 'dusk' ? 0xffccaa 
    : timeOfDay === 'night' ? 0x8899aa 
    : 0xeeeecc;
  
  const drawDust = useCallback((g: Graphics) => {
    g.clear();
    const animationTime = getAnimationTime();
    
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
  }, [width, height, dustColor]);

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
}: DayNightLayerProps) {
  const tint = TIME_OF_DAY_TINTS[timeOfDay];

  const drawDayNight = useCallback((g: Graphics) => {
    g.clear();
    const animationTime = getAnimationTime();
    const pulse = timeOfDay === 'night' 
      ? Math.sin(animationTime * 0.0005) * 0.03 
      : 0;
    g.rect(0, 0, width, height);
    g.fill({ color: tint.color, alpha: tint.alpha + pulse });
  }, [width, height, tint.color, tint.alpha, timeOfDay]);

  if (tint.alpha === 0) return null;

  return <pixiGraphics draw={drawDayNight} />;
});

interface GameSceneProps extends PixiViewportProps {
  width: number;
  height: number;
}

function GameScene({
  map,
  playerPosition,
  viewport,
  weather,
  timeOfDay,
  visibilityHash,
  isTileVisible,
  isTileExplored,
  width,
  height,
  lightSources,
  multiTileObjects = [],
}: GameSceneProps) {
  const startTimeRef = useRef(0);
  const [texturesReady, setTexturesReady] = useState(false);
  
  useEffect(() => {
    startTimeRef.current = Date.now();
    loadTileTextures().then(() => setTexturesReady(true));
  }, []);
  
  useTick(() => {
    if (startTimeRef.current === 0) return;
    setAnimationTime(Date.now() - startTimeRef.current);
  });

  if (!texturesReady) return null;

  return (
    <pixiContainer>
      <TileLayer map={map} viewport={viewport} />
      <AnimatedTileLayer map={map} viewport={viewport} />
      <FeatureLayer map={map} viewport={viewport} />
      <TransitionLayer map={map} viewport={viewport} texturesReady={texturesReady} />
      <ConnectedTileLayer map={map} viewport={viewport} texturesReady={texturesReady} />
      <MultiTileObjectLayer multiTileObjects={multiTileObjects} viewport={viewport} texturesReady={texturesReady} />
      <OverlayLayer map={map} viewport={viewport} texturesReady={texturesReady} />
      <ShadowLayer map={map} viewport={viewport} timeOfDay={timeOfDay} />
      <FogOfWarLayer 
        key={visibilityHash}
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
        playerPosition={playerPosition}
        width={width}
        height={height}
      />
      <DayNightLayer width={width} height={height} timeOfDay={timeOfDay} />
      <RainLayer width={width} height={height} weather={weather} />
      <FogLayer width={width} height={height} weather={weather} />
      <FireflyLayer width={width} height={height} timeOfDay={timeOfDay} />
      <AmbientDustLayer width={width} height={height} timeOfDay={timeOfDay} />
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
  multiTileObjects,
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
        multiTileObjects={multiTileObjects}
      />
    </Application>
  );
}
