import { memo, useCallback, useMemo } from 'react';
import type { Graphics } from 'pixi.js';
import { BlurFilter } from 'pixi.js';
import type { Position, ViewportBounds } from '../../types';
import type { LightSource, LightScreenData } from '../../utils/lighting';
import {
  getLightFlicker,
  getVisibleLights,
  createLightSource,
  calculateDarknessAt,
  BASE_DARKNESS,
} from '../../utils/lighting';
import { TILE_SIZE } from '../../utils/constants';
import { getAnimationTime } from './animationTime';

const DARKNESS_BLUR = (() => {
  const filter = new BlurFilter({ strength: 24, quality: 2 });
  return [filter];
})();

const CELL_SIZE = TILE_SIZE;

interface LightLayerProps {
  lights: LightSource[];
  viewport: ViewportBounds;
  playerPosition?: Position;
  width: number;
  height: number;
}

export const LightLayer = memo(function LightLayer({
  lights,
  viewport,
  playerPosition,
  width,
  height,
}: LightLayerProps) {
  const playerX = playerPosition?.x;
  const playerY = playerPosition?.y;

  const playerLight = useMemo(() => {
    if (playerX === undefined || playerY === undefined) return null;
    return createLightSource('player-torch', { x: playerX, y: playerY }, 'torch');
  }, [playerX, playerY]);

  const visibleTileLights = useMemo(
    () => getVisibleLights(lights, viewport),
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
    return visibleTileLights.concat(playerLight);
  }, [visibleTileLights, playerLight, viewport.startX, viewport.startY, viewport.endX, viewport.endY]);

  const drawDarkness = useCallback(
    (g: Graphics) => {
      g.clear();
      
      if (allVisibleLights.length === 0) {
        g.rect(0, 0, width, height);
        g.fill({ color: 0x000000, alpha: BASE_DARKNESS });
        return;
      }

      const animationTime = getAnimationTime();

      const lightData: LightScreenData[] = allVisibleLights.map(light => {
        const state = getLightFlicker(light, animationTime, light.position.x, light.position.y);
        return {
          screenX: (light.position.x - viewport.startX) * TILE_SIZE + TILE_SIZE / 2,
          screenY: (light.position.y - viewport.startY) * TILE_SIZE + TILE_SIZE / 2,
          radius: TILE_SIZE * state.radius * 5,
          intensity: state.intensity * 2,
        };
      });

      const cols = Math.ceil(width / CELL_SIZE);
      const rows = Math.ceil(height / CELL_SIZE);

      let minLightCol = cols;
      let maxLightCol = 0;
      let minLightRow = rows;
      let maxLightRow = 0;

      for (const light of lightData) {
        const colMin = Math.max(0, Math.floor((light.screenX - light.radius) / CELL_SIZE));
        const colMax = Math.min(cols - 1, Math.ceil((light.screenX + light.radius) / CELL_SIZE));
        const rowMin = Math.max(0, Math.floor((light.screenY - light.radius) / CELL_SIZE));
        const rowMax = Math.min(rows - 1, Math.ceil((light.screenY + light.radius) / CELL_SIZE));
        
        minLightCol = Math.min(minLightCol, colMin);
        maxLightCol = Math.max(maxLightCol, colMax);
        minLightRow = Math.min(minLightRow, rowMin);
        maxLightRow = Math.max(maxLightRow, rowMax);
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const isInLightZone = 
            col >= minLightCol && col <= maxLightCol &&
            row >= minLightRow && row <= maxLightRow;

          if (!isInLightZone) {
            g.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            g.fill({ color: 0x000000, alpha: BASE_DARKNESS });
            continue;
          }

          const cellCenterX = col * CELL_SIZE + CELL_SIZE / 2;
          const cellCenterY = row * CELL_SIZE + CELL_SIZE / 2;
          
          const darkness = calculateDarknessAt(cellCenterX, cellCenterY, lightData);
          
          if (darkness > 0.01) {
            g.rect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            g.fill({ color: 0x000000, alpha: darkness });
          }
        }
      }
    },
    [allVisibleLights, viewport.startX, viewport.startY, width, height]
  );

  return <pixiGraphics filters={DARKNESS_BLUR} draw={drawDarkness} />;
});
