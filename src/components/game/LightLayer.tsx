import { memo, useCallback, useMemo } from 'react';
import type { Graphics } from 'pixi.js';
import { BlurFilter } from 'pixi.js';
import type { Position, AnimatedViewportProps, ViewportBounds } from '../../types';
import type { LightSource } from '../../utils/lighting';
import { getLightFlicker, getVisibleLights, createLightSource } from '../../utils/lighting';
import { TILE_SIZE } from '../../utils/constants';

const LIGHT_BLUR_OUTER = (() => {
  const filter = new BlurFilter({ strength: 20, quality: 2 });
  return [filter];
})();

const LIGHT_BLUR_MID = (() => {
  const filter = new BlurFilter({ strength: 12, quality: 2 });
  return [filter];
})();

const LIGHT_BLUR_INNER = (() => {
  const filter = new BlurFilter({ strength: 6, quality: 2 });
  return [filter];
})();

interface LightLayerProps extends AnimatedViewportProps {
  lights: LightSource[];
  playerPosition?: Position;
}

interface LightSubLayerProps {
  visibleLights: LightSource[];
  viewport: ViewportBounds;
  animationTime: number;
}

const LightLayerOuter = memo(function LightLayerOuter({
  visibleLights,
  viewport,
  animationTime,
}: LightSubLayerProps) {
  const drawOuter = useCallback((g: Graphics) => {
    g.clear();
    
    for (const light of visibleLights) {
      const state = getLightFlicker(light, animationTime, light.position.x, light.position.y);
      const screenX = (light.position.x - viewport.startX) * TILE_SIZE + TILE_SIZE / 2;
      const screenY = (light.position.y - viewport.startY) * TILE_SIZE + TILE_SIZE / 2;
      
      g.circle(screenX, screenY, TILE_SIZE * state.radius * 2.5);
      g.fill({ color: state.color, alpha: state.intensity * 0.15 });
    }
  }, [visibleLights, viewport, animationTime]);
  
  return <pixiGraphics filters={LIGHT_BLUR_OUTER} draw={drawOuter} blendMode="add" />;
});

const LightLayerMid = memo(function LightLayerMid({
  visibleLights,
  viewport,
  animationTime,
}: LightSubLayerProps) {
  const drawMid = useCallback((g: Graphics) => {
    g.clear();
    
    for (const light of visibleLights) {
      const state = getLightFlicker(light, animationTime, light.position.x, light.position.y);
      const screenX = (light.position.x - viewport.startX) * TILE_SIZE + TILE_SIZE / 2;
      const screenY = (light.position.y - viewport.startY) * TILE_SIZE + TILE_SIZE / 2;
      
      g.circle(screenX, screenY, TILE_SIZE * state.radius * 1.5);
      g.fill({ color: state.color, alpha: state.intensity * 0.25 });
    }
  }, [visibleLights, viewport, animationTime]);
  
  return <pixiGraphics filters={LIGHT_BLUR_MID} draw={drawMid} blendMode="add" />;
});

const LightLayerInner = memo(function LightLayerInner({
  visibleLights,
  viewport,
  animationTime,
}: LightSubLayerProps) {
  const drawInner = useCallback((g: Graphics) => {
    g.clear();
    
    for (const light of visibleLights) {
      const state = getLightFlicker(light, animationTime, light.position.x, light.position.y);
      const screenX = (light.position.x - viewport.startX) * TILE_SIZE + TILE_SIZE / 2;
      const screenY = (light.position.y - viewport.startY) * TILE_SIZE + TILE_SIZE / 2;
      
      const coreColor = brightenColor(state.color, 0.3);
      g.circle(screenX, screenY, TILE_SIZE * state.radius * 0.7);
      g.fill({ color: coreColor, alpha: state.intensity * 0.35 });
    }
  }, [visibleLights, viewport, animationTime]);
  
  return <pixiGraphics filters={LIGHT_BLUR_INNER} draw={drawInner} blendMode="add" />;
});

function brightenColor(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((color >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (color & 0xff) + Math.round(255 * amount));
  return (r << 16) | (g << 8) | b;
}

export const LightLayer = memo(function LightLayer({
  lights,
  viewport,
  animationTime,
  playerPosition,
}: LightLayerProps) {
  const playerX = playerPosition?.x;
  const playerY = playerPosition?.y;
  
  const playerLight = useMemo(() => {
    if (playerX === undefined || playerY === undefined) return null;
    return createLightSource('player-torch', { x: playerX, y: playerY }, 'torch');
  }, [playerX, playerY]);
  
  const visibleTileLights = useMemo(() => 
    getVisibleLights(lights, viewport),
    [lights, viewport]
  );
  
  const allVisibleLights = useMemo(() => {
    if (!playerLight) return visibleTileLights;
    const isPlayerVisible = 
      playerLight.position.x >= viewport.startX - 10 &&
      playerLight.position.x < viewport.endX + 10 &&
      playerLight.position.y >= viewport.startY - 10 &&
      playerLight.position.y < viewport.endY + 10;
    
    if (!isPlayerVisible) return visibleTileLights;
    return [...visibleTileLights, playerLight];
  }, [visibleTileLights, playerLight, viewport.startX, viewport.startY, viewport.endX, viewport.endY]);
  
  if (allVisibleLights.length === 0) return null;
  
  return (
    <pixiContainer>
      <LightLayerOuter visibleLights={allVisibleLights} viewport={viewport} animationTime={animationTime} />
      <LightLayerMid visibleLights={allVisibleLights} viewport={viewport} animationTime={animationTime} />
      <LightLayerInner visibleLights={allVisibleLights} viewport={viewport} animationTime={animationTime} />
    </pixiContainer>
  );
});
