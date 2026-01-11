import type { MapData, TileId } from '../types';
import { TILE_ID_BY_TYPE, TILE_MAPPING } from '../tiles';
import { createSeededNoise2D, fbm, normalizeNoise } from './noise';
import { getBiomeTiles, applyIslandMask } from './biomes';
import { seededRandom } from './seedUtils';

const T = TILE_ID_BY_TYPE;

const NO_FEATURE = 0;


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

function addRiver(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  let x = Math.floor(width * 0.3 + random() * width * 0.4);
  let y = 0;

  while (y < height) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      if (nx >= 0 && nx < width) {
        layers.terrain[y][nx] = T.water;
        layers.features[y][nx] = NO_FEATURE;
      }
    }

    y++;
    const drift = random();
    if (drift < 0.3) x = Math.max(5, x - 1);
    else if (drift > 0.7) x = Math.min(width - 6, x + 1);
  }
}

function addLakes(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  const lakeCount = 3 + Math.floor(random() * 3);

  for (let i = 0; i < lakeCount; i++) {
    const cx = 10 + Math.floor(random() * (width - 20));
    const cy = 10 + Math.floor(random() * (height - 20));
    const radius = 3 + Math.floor(random() * 4);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + random() * 0.5) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
            layers.terrain[ny][nx] = T.water;
            layers.features[ny][nx] = NO_FEATURE;
          }
        }
      }
    }
  }
}

function addRoads(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  const roadLength = 15 + Math.floor(random() * 10);

  for (let x = centerX - roadLength; x <= centerX + roadLength; x++) {
    if (x >= 0 && x < width && layers.terrain[centerY][x] !== T.water && layers.terrain[centerY][x] !== T.deep_water) {
      layers.terrain[centerY][x] = T.road;
      layers.features[centerY][x] = NO_FEATURE;
    }
  }

  for (let y = centerY - roadLength; y <= centerY + roadLength; y++) {
    if (y >= 0 && y < height && layers.terrain[y][centerX] !== T.water && layers.terrain[y][centerX] !== T.deep_water) {
      layers.terrain[y][centerX] = T.road;
      layers.features[y][centerX] = NO_FEATURE;
    }
  }
}

function addSwamps(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (layers.terrain[y][x] === T.water) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (layers.terrain[ny][nx] === T.grass && layers.features[ny][nx] === NO_FEATURE && random() < 0.3) {
                layers.terrain[ny][nx] = T.swamp;
              }
            }
          }
        }
      }
    }
  }
}

function addRuins(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  const ruinCount = 3 + Math.floor(random() * 4);

  for (let i = 0; i < ruinCount; i++) {
    const cx = 10 + Math.floor(random() * (width - 20));
    const cy = 10 + Math.floor(random() * (height - 20));
    const size = 2 + Math.floor(random() * 2);

    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          if (layers.terrain[ny][nx] === T.grass && layers.features[ny][nx] === NO_FEATURE && random() < 0.6) {
            layers.features[ny][nx] = T.ruins;
          }
        }
      }
    }
  }
}

function addGraveyards(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  const graveyardCount = 2 + Math.floor(random() * 2);

  for (let i = 0; i < graveyardCount; i++) {
    const cx = 15 + Math.floor(random() * (width - 30));
    const cy = 15 + Math.floor(random() * (height - 30));
    const sizeX = 3 + Math.floor(random() * 3);
    const sizeY = 2 + Math.floor(random() * 2);

    for (let dy = -sizeY; dy <= sizeY; dy++) {
      for (let dx = -sizeX; dx <= sizeX; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          if (layers.terrain[ny][nx] === T.grass && layers.features[ny][nx] === NO_FEATURE) {
            layers.features[ny][nx] = T.graveyard;
          }
        }
      }
    }
  }
}

function addBlightedAreas(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  const blightCount = 2 + Math.floor(random() * 3);

  for (let i = 0; i < blightCount; i++) {
    const cx = 10 + Math.floor(random() * (width - 20));
    const cy = 10 + Math.floor(random() * (height - 20));
    const radius = 4 + Math.floor(random() * 4);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
            const terrain = layers.terrain[ny][nx];
            if (terrain === T.grass && random() < 0.7) {
              layers.features[ny][nx] = T.blight;
            }
          }
        }
      }
    }
  }
}

function addDeadForestPatches(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  const patchCount = 2 + Math.floor(random() * 3);

  for (let i = 0; i < patchCount; i++) {
    const cx = 15 + Math.floor(random() * (width - 30));
    const cy = 15 + Math.floor(random() * (height - 30));
    const radius = 3 + Math.floor(random() * 3);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
            const feature = layers.features[ny][nx];
            const terrain = layers.terrain[ny][nx];
            if (feature === T.forest && random() < 0.8) {
              layers.features[ny][nx] = T.dead_forest;
            } else if (terrain === T.grass && feature === NO_FEATURE && random() < 0.6) {
              layers.terrain[ny][nx] = T.withered_grass;
            }
          }
        }
      }
    }
  }
}

function addToxicMarshes(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  const marshCount = 1 + Math.floor(random() * 2);

  for (let i = 0; i < marshCount; i++) {
    const cx = 10 + Math.floor(random() * (width - 20));
    const cy = 10 + Math.floor(random() * (height - 20));
    const radius = 2 + Math.floor(random() * 3);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + random() * 0.5) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
            const terrain = layers.terrain[ny][nx];
            if ((terrain === T.swamp || terrain === T.grass) && layers.features[ny][nx] === NO_FEATURE && random() < 0.7) {
              layers.terrain[ny][nx] = T.toxic_marsh;
            }
          }
        }
      }
    }
  }
}

function addCharredAreas(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (layers.terrain[y][x] === T.lava) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
              const terrain = layers.terrain[ny][nx];
              const feature = layers.features[ny][nx];
              if ((terrain === T.grass || feature === T.forest) && random() < 0.5) {
                layers.terrain[ny][nx] = T.charred_ground;
                layers.features[ny][nx] = NO_FEATURE;
              }
            }
          }
        }
      }
    }
  }
}

function addEnvironmentDetails(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const terrain = layers.terrain[y][x];
      const feature = layers.features[y][x];

      if (feature === T.graveyard && random() < 0.15) {
        layers.features[y][x] = T.bone_pile;
        continue;
      }

      if (feature === T.ruins) {
        const roll = random();
        if (roll < 0.2) {
          layers.features[y][x] = T.rubble;
          continue;
        } else if (roll < 0.3) {
          layers.features[y][x] = T.web;
          continue;
        }
      }

      if (terrain === T.swamp && random() < 0.08) {
        layers.terrain[y][x] = T.miasma;
        continue;
      }

      if (feature === T.blight) {
        const roll = random();
        if (roll < 0.1) {
          layers.features[y][x] = T.cursed_ground;
          continue;
        } else if (roll < 0.25) {
          layers.features[y][x] = T.lichen;
          continue;
        }
      }

      if (terrain === T.grass && feature === NO_FEATURE && random() < 0.03) {
        layers.features[y][x] = T.flowers;
      }
    }
  }
}

function addFeatures(
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): void {
  addRiver(layers, width, height, random);
  addLakes(layers, width, height, random);
  addRoads(layers, width, height, random);
  addSwamps(layers, width, height, random);
  addRuins(layers, width, height, random);
  addGraveyards(layers, width, height, random);
  addBlightedAreas(layers, width, height, random);
  addDeadForestPatches(layers, width, height, random);
  addToxicMarshes(layers, width, height, random);
  addCharredAreas(layers, width, height, random);
  addEnvironmentDetails(layers, width, height, random);
}

function findSpawnPoint(layers: BiomeLayerData, width: number, height: number): { x: number; y: number } {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  const walkableTerrains = [T.grass, T.sand, T.road, T.swamp];
  const walkableFeatures = [T.forest, T.ruins, T.graveyard, T.hills];
  const blockingFeatures = [T.mountain, T.water, T.deep_water, T.lava, T.chasm];

  for (let radius = 0; radius < Math.max(width, height) / 2; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const terrain = layers.terrain[y][x];
          const feature = layers.features[y][x];

          if (blockingFeatures.includes(feature)) continue;

          if (walkableFeatures.includes(feature)) {
            return { x, y };
          }
          if (feature === NO_FEATURE && walkableTerrains.includes(terrain)) {
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

  addFeatures(layers, width, height, random);

  const spawnPoint = findSpawnPoint(layers, width, height);

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
  };
}
