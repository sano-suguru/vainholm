import { memo, useCallback, useMemo } from 'react';
import type { Graphics } from 'pixi.js';
import { BlurFilter } from 'pixi.js';
import type { MapData, TileType, AnimatedViewportProps } from '../../types';
import { TILE_SIZE } from '../../utils/constants';

const PARTICLE_BLUR = (() => {
  const filter = new BlurFilter({ strength: 3, quality: 1 });
  return [filter];
})();

interface ParticleLayerProps extends AnimatedViewportProps {
  map: MapData;
}

const PARTICLE_TILES: Partial<Record<TileType, ParticleConfig>> = {
  lava: {
    type: 'ember',
    color: 0xff6622,
    density: 3,
    speed: 40,
    size: 2,
    lifetime: 1500,
  },
  blight: {
    type: 'float',
    color: 0xaa55dd,
    density: 2,
    speed: 15,
    size: 1.5,
    lifetime: 2000,
  },
  water: {
    type: 'sparkle',
    color: 0x88ddff,
    density: 1,
    speed: 0,
    size: 1,
    lifetime: 800,
  },
  swamp: {
    type: 'bubble',
    color: 0x88aa66,
    density: 1,
    speed: 8,
    size: 2,
    lifetime: 1200,
  },
};

interface ParticleConfig {
  type: 'ember' | 'float' | 'sparkle' | 'bubble';
  color: number;
  density: number;
  speed: number;
  size: number;
  lifetime: number;
}

function hashPosition(x: number, y: number, seed: number): number {
  const n = x * 374761393 + y * 668265263 + seed * 1274126177;
  return ((n ^ (n >> 13)) * 1274126177) >>> 0;
}

function getParticleState(
  x: number,
  y: number,
  particleIndex: number,
  time: number,
  config: ParticleConfig
): { px: number; py: number; alpha: number; size: number } | null {
  const seed = hashPosition(x, y, particleIndex);
  const startOffset = (seed % 10000) / 10000 * config.lifetime;
  const cycleTime = (time + startOffset) % config.lifetime;
  const progress = cycleTime / config.lifetime;
  
  if (progress > 0.95) return null;
  
  const baseX = (seed % 1000) / 1000 * TILE_SIZE;
  const baseY = ((seed >> 10) % 1000) / 1000 * TILE_SIZE;
  
  let px = baseX;
  let py = baseY;
  
  switch (config.type) {
    case 'ember':
      py -= progress * config.speed * (config.lifetime / 1000);
      px += Math.sin(time * 0.005 + seed) * 3;
      break;
    case 'float':
      py -= progress * config.speed * (config.lifetime / 1000);
      px += Math.sin(time * 0.003 + seed) * 5;
      break;
    case 'sparkle':
      break;
    case 'bubble':
      py -= progress * config.speed * (config.lifetime / 1000);
      px += Math.sin(time * 0.008 + seed * 0.1) * 2;
      break;
  }
  
  const fadeIn = Math.min(1, progress * 4);
  const fadeOut = Math.min(1, (1 - progress) * 3);
  const alpha = fadeIn * fadeOut * 0.8;
  
  const sizeVariation = 0.7 + Math.sin(time * 0.01 + seed) * 0.3;
  const size = config.size * sizeVariation * (1 - progress * 0.3);
  
  return { px, py, alpha, size };
}

export const ParticleLayer = memo(function ParticleLayer({
  map,
  viewport,
  animationTime,
}: ParticleLayerProps) {
  const particleTiles = useMemo(() => {
    const tiles: { x: number; y: number; config: ParticleConfig }[] = [];
    const layer = map.layers[0];
    if (!layer) return tiles;
    
    for (let y = viewport.startY; y < viewport.endY; y++) {
      for (let x = viewport.startX; x < viewport.endX; x++) {
        if (y < 0 || y >= map.height || x < 0 || x >= map.width) continue;
        
        const tileId = layer.data[y]?.[x];
        if (tileId === undefined) continue;
        
        const tileType = map.tileMapping[String(tileId)] as TileType;
        const config = PARTICLE_TILES[tileType];
        
        if (config) {
          tiles.push({ x, y, config });
        }
      }
    }
    
    return tiles;
  }, [map, viewport.startX, viewport.startY, viewport.endX, viewport.endY]);
  
  const drawParticles = useCallback((g: Graphics) => {
    g.clear();
    
    for (const tile of particleTiles) {
      const screenBaseX = (tile.x - viewport.startX) * TILE_SIZE;
      const screenBaseY = (tile.y - viewport.startY) * TILE_SIZE;
      
      for (let i = 0; i < tile.config.density; i++) {
        const state = getParticleState(
          tile.x,
          tile.y,
          i,
          animationTime,
          tile.config
        );
        
        if (!state) continue;
        
        const screenX = screenBaseX + state.px;
        const screenY = screenBaseY + state.py;
        
        g.circle(screenX, screenY, state.size);
        g.fill({ color: tile.config.color, alpha: state.alpha });
      }
    }
  }, [particleTiles, viewport.startX, viewport.startY, animationTime]);
  
  if (particleTiles.length === 0) return null;
  
  return <pixiGraphics filters={PARTICLE_BLUR} draw={drawParticles} />;
});
