import type { MapData, TileId, Position } from '../types';
import { TILE_MAPPING } from '../tiles';
import { createSeededNoise2D, fbm, normalizeNoise } from './noise';
import { getBiomeTiles, applyIslandMask } from './biomes';
import { seededRandom } from './seedUtils';
import { runPipeline, ALL_PHASES, isWalkableTile as isWalkableTileFromConstraints } from './mapGeneration';

interface BiomeLayerData {
  terrain: TileId[][];
  features: TileId[][];
}

function generateBiomeData(
  width: number,
  height: number,
  seed: number
): BiomeLayerData {
  const elevationNoise = createSeededNoise2D(seed);
  const moistureNoise = createSeededNoise2D(seed + 1000);

  const terrain: TileId[][] = [];
  const features: TileId[][] = [];

  for (let y = 0; y < height; y++) {
    const terrainRow: TileId[] = [];
    const featureRow: TileId[] = [];
    for (let x = 0; x < width; x++) {
      const rawElevation = fbm(elevationNoise, x, y, { scale: 0.02, octaves: 5 });
      const elevation = applyIslandMask(
        normalizeNoise(rawElevation),
        x, y, width, height
      );

      const rawMoisture = fbm(moistureNoise, x, y, { scale: 0.015, octaves: 4 });
      const moisture = normalizeNoise(rawMoisture);

      const biome = getBiomeTiles(elevation, moisture);
      terrainRow.push(biome.terrain);
      featureRow.push(biome.feature);
    }
    terrain.push(terrainRow);
    features.push(featureRow);
  }

  return { terrain, features };
}

function addFeatures(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): Position | null {
  const result = runPipeline(ALL_PHASES, layers, width, height, random);

  if (!result.success) {
    return null;
  }

  const dungeonEntrance = result.finalMetadata['dungeonEntrance'] as Position | undefined;
  return dungeonEntrance ?? null;
}

function isWalkableTile(terrain: TileId, feature: TileId): boolean {
  return isWalkableTileFromConstraints(terrain, feature);
}

function findSpawnPoint(
  layers: BiomeLayerData,
  width: number,
  height: number,
  dungeonEntrance?: Position
): Position {
  if (dungeonEntrance) {
    const { x: cx, y: cy } = dungeonEntrance;
    for (let radius = 1; radius < 6; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const terrain = layers.terrain[y][x];
            const feature = layers.features[y][x];
            if (isWalkableTile(terrain, feature)) {
              return { x, y };
            }
          }
        }
      }
    }
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  for (let radius = 0; radius < Math.max(width, height) / 2; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const terrain = layers.terrain[y][x];
          const feature = layers.features[y][x];
          if (isWalkableTile(terrain, feature)) {
            return { x, y };
          }
        }
      }
    }
  }

  return { x: centerX, y: centerY };
}

export function generateMapData(
  width: number,
  height: number,
  seed: number = 12345
): MapData {
  const random = seededRandom(seed);
  const layers = generateBiomeData(width, height, seed);

  const dungeonEntrancePosition = addFeatures(layers, width, height, random);

  const spawnPoint = findSpawnPoint(layers, width, height, dungeonEntrancePosition ?? undefined);

  return {
    name: 'Generated World',
    width,
    height,
    tileSize: 32,
    layers: [
      { name: 'terrain', data: layers.terrain },
      { name: 'features', data: layers.features },
    ],
    tileMapping: TILE_MAPPING,
    spawnPoint,
    dungeonEntrance: dungeonEntrancePosition ?? undefined,
  };
}
