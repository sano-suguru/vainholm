import type { TileId } from '../../types';
import type { PlacementMutator, BiomeLayerData } from './types';

const NO_FEATURE = 0;

export function createPlacementMutator(
  layers: BiomeLayerData,
  metadata: Map<string, unknown>
): PlacementMutator {
  const setTerrain = (x: number, y: number, tile: TileId): void => {
    if (y >= 0 && y < layers.terrain.length && x >= 0 && x < layers.terrain[0].length) {
      layers.terrain[y][x] = tile;
    }
  };

  const setFeature = (x: number, y: number, tile: TileId): void => {
    if (y >= 0 && y < layers.features.length && x >= 0 && x < layers.features[0].length) {
      layers.features[y][x] = tile;
    }
  };

  const clearFeature = (x: number, y: number): void => {
    setFeature(x, y, NO_FEATURE);
  };

  const setMetadata = (key: string, value: unknown): void => {
    metadata.set(key, value);
  };

  return {
    setTerrain,
    setFeature,
    clearFeature,
    setMetadata,
  };
}
