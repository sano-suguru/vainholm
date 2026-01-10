import { useMemo } from 'react';
import type { Position, ViewportBounds } from '../types';
import { VIEWPORT_WIDTH_TILES, VIEWPORT_HEIGHT_TILES } from '../utils/constants';

export function useViewport(
  playerPosition: Position,
  mapWidth: number,
  mapHeight: number
): ViewportBounds {
  return useMemo(() => {
    const halfWidth = Math.floor(VIEWPORT_WIDTH_TILES / 2);
    const halfHeight = Math.floor(VIEWPORT_HEIGHT_TILES / 2);

    let startX = playerPosition.x - halfWidth;
    let startY = playerPosition.y - halfHeight;

    startX = Math.max(0, Math.min(startX, mapWidth - VIEWPORT_WIDTH_TILES));
    startY = Math.max(0, Math.min(startY, mapHeight - VIEWPORT_HEIGHT_TILES));

    return {
      startX,
      startY,
      endX: startX + VIEWPORT_WIDTH_TILES,
      endY: startY + VIEWPORT_HEIGHT_TILES,
    };
  }, [playerPosition.x, playerPosition.y, mapWidth, mapHeight]);
}
