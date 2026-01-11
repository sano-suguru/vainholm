import type { TileId } from '../types';
import { TILE_ID_BY_TYPE } from '../tiles';

interface BiomeThresholds {
  elevation: number[];
  moisture: number[];
}

const BIOME_THRESHOLDS: BiomeThresholds = {
  elevation: [0.2, 0.35, 0.55, 0.7, 0.85],
  moisture: [0.25, 0.5, 0.75],
};

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

const TERRAIN_TABLE: TileId[][] = [
  [T.deep_water, T.deep_water, T.deep_water, T.deep_water],
  [T.water, T.water, T.water, T.water],
  [T.sand, T.sand, T.swamp, T.swamp],
  [T.sand, T.grass, T.grass, T.swamp],
  [T.grass, T.grass, T.grass, T.grass],
  [T.grass, T.grass, T.grass, T.grass],
  [T.grass, T.grass, T.snow, T.snow],
];

const FEATURE_TABLE: TileId[][] = [
  [NO_FEATURE, NO_FEATURE, NO_FEATURE, NO_FEATURE],
  [NO_FEATURE, NO_FEATURE, NO_FEATURE, NO_FEATURE],
  [NO_FEATURE, NO_FEATURE, NO_FEATURE, NO_FEATURE],
  [NO_FEATURE, NO_FEATURE, NO_FEATURE, NO_FEATURE],
  [NO_FEATURE, NO_FEATURE, T.forest, T.forest],
  [T.hills, T.hills, T.forest, T.forest],
  [T.mountain, T.mountain, T.mountain, T.mountain],
];

const MAX_ELEVATION_INDEX = TERRAIN_TABLE.length - 1;
const MAX_MOISTURE_INDEX = TERRAIN_TABLE[0].length - 1;

function getElevationIndex(elevation: number): number {
  const thresholds = BIOME_THRESHOLDS.elevation;
  for (let i = 0; i < thresholds.length; i++) {
    if (elevation < thresholds[i]) return i;
  }
  return Math.min(thresholds.length, MAX_ELEVATION_INDEX);
}

function getMoistureIndex(moisture: number): number {
  const thresholds = BIOME_THRESHOLDS.moisture;
  for (let i = 0; i < thresholds.length; i++) {
    if (moisture < thresholds[i]) return i;
  }
  return Math.min(thresholds.length, MAX_MOISTURE_INDEX);
}

export interface BiomeResult {
  terrain: TileId;
  feature: TileId;
}

export function getBiomeTiles(elevation: number, moisture: number): BiomeResult {
  const elevIndex = getElevationIndex(elevation);
  const moistIndex = getMoistureIndex(moisture);
  return {
    terrain: TERRAIN_TABLE[elevIndex][moistIndex],
    feature: FEATURE_TABLE[elevIndex][moistIndex],
  };
}

export function applyIslandMask(
  elevation: number,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const normalizedDist = dist / maxDist;

  const falloff = 1 - Math.pow(normalizedDist, 1.5);
  return elevation * falloff;
}
