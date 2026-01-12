import type { TileId } from '../../types';
import type {
  PlacementContext,
  PlacementResult,
  NamedConstraint,
  BoundingBox,
} from './types';

export function createPlacementContext(
  terrain: TileId[][],
  features: TileId[][],
  width: number,
  height: number,
  random: () => number
): PlacementContext & { setMetadataInternal: (key: string, value: unknown) => void } {
  const metadata = new Map<string, unknown>();

  const isInBounds = (x: number, y: number): boolean => {
    return x >= 0 && x < width && y >= 0 && y < height;
  };

  const getTerrain = (x: number, y: number): TileId => {
    if (!isInBounds(x, y)) return -1;
    return terrain[y][x];
  };

  const getFeature = (x: number, y: number): TileId => {
    if (!isInBounds(x, y)) return -1;
    return features[y][x];
  };

  const canPlace = (x: number, y: number, constraints: NamedConstraint[]): boolean => {
    return constraints.every((c) => c.check(ctx, x, y));
  };

  const findValidPosition = (
    constraints: NamedConstraint[],
    searchArea?: BoundingBox,
    maxAttempts = 100
  ): PlacementResult => {
    const area = searchArea ?? {
      minX: 10,
      minY: 10,
      maxX: width - 10,
      maxY: height - 10,
    };

    const rangeX = area.maxX - area.minX;
    const rangeY = area.maxY - area.minY;

    if (rangeX <= 0 || rangeY <= 0) {
      return {
        valid: false,
        position: { x: 0, y: 0 },
        reason: 'Invalid search area',
      };
    }

    for (let i = 0; i < maxAttempts; i++) {
      const x = area.minX + Math.floor(random() * rangeX);
      const y = area.minY + Math.floor(random() * rangeY);

      if (canPlace(x, y, constraints)) {
        return { valid: true, position: { x, y } };
      }
    }

    return {
      valid: false,
      position: { x: 0, y: 0 },
      reason: `No valid position found after ${maxAttempts} attempts`,
    };
  };

  const getMetadata = <T>(key: string): T | undefined => {
    return metadata.get(key) as T | undefined;
  };

  const setMetadataInternal = (key: string, value: unknown): void => {
    metadata.set(key, value);
  };

  const ctx: PlacementContext & { setMetadataInternal: (key: string, value: unknown) => void } = {
    width,
    height,
    random,
    isInBounds,
    getTerrain,
    getFeature,
    canPlace,
    findValidPosition,
    getMetadata,
    setMetadataInternal,
  };

  return ctx;
}
