import type { TileId, Position } from '../../types';
import type { NamedConstraint, PlacementContext } from './types';
import { TILE_ID_BY_TYPE } from '../../tiles';

const NO_FEATURE = 0;

const WALKABLE_TERRAINS: TileId[] = [
  TILE_ID_BY_TYPE.grass,
  TILE_ID_BY_TYPE.sand,
  TILE_ID_BY_TYPE.road,
  TILE_ID_BY_TYPE.swamp,
];

const WALKABLE_FEATURES: TileId[] = [
  TILE_ID_BY_TYPE.forest,
  TILE_ID_BY_TYPE.ruins,
  TILE_ID_BY_TYPE.graveyard,
  TILE_ID_BY_TYPE.hills,
  TILE_ID_BY_TYPE.dungeon_entrance,
];

const BLOCKING_FEATURES: TileId[] = [
  TILE_ID_BY_TYPE.mountain,
  TILE_ID_BY_TYPE.water,
  TILE_ID_BY_TYPE.deep_water,
  TILE_ID_BY_TYPE.lava,
  TILE_ID_BY_TYPE.chasm,
];

const UNWALKABLE_TERRAINS: TileId[] = [
  TILE_ID_BY_TYPE.water,
  TILE_ID_BY_TYPE.deep_water,
  TILE_ID_BY_TYPE.lava,
  TILE_ID_BY_TYPE.chasm,
];

function isWalkableTile(terrain: TileId, feature: TileId): boolean {
  if (BLOCKING_FEATURES.includes(feature)) return false;
  if (WALKABLE_FEATURES.includes(feature)) return true;
  if (feature === NO_FEATURE && WALKABLE_TERRAINS.includes(terrain)) return true;
  return false;
}

export const Constraints = {
  inBounds: (margin = 0): NamedConstraint => ({
    name: `inBounds(${margin})`,
    check: (ctx: PlacementContext, x: number, y: number) =>
      x >= margin &&
      x < ctx.width - margin &&
      y >= margin &&
      y < ctx.height - margin,
  }),

  terrainIs: (...types: TileId[]): NamedConstraint => ({
    name: `terrainIs(${types.join(',')})`,
    check: (ctx: PlacementContext, x: number, y: number) =>
      types.includes(ctx.getTerrain(x, y)),
  }),

  terrainNot: (...types: TileId[]): NamedConstraint => ({
    name: `terrainNot(${types.join(',')})`,
    check: (ctx: PlacementContext, x: number, y: number) =>
      !types.includes(ctx.getTerrain(x, y)),
  }),

  featureEmpty: (): NamedConstraint => ({
    name: 'featureEmpty',
    check: (ctx: PlacementContext, x: number, y: number) =>
      ctx.getFeature(x, y) === NO_FEATURE,
  }),

  featureIs: (...types: TileId[]): NamedConstraint => ({
    name: `featureIs(${types.join(',')})`,
    check: (ctx: PlacementContext, x: number, y: number) =>
      types.includes(ctx.getFeature(x, y)),
  }),

  featureNot: (...types: TileId[]): NamedConstraint => ({
    name: `featureNot(${types.join(',')})`,
    check: (ctx: PlacementContext, x: number, y: number) =>
      !types.includes(ctx.getFeature(x, y)),
  }),

  walkable: (): NamedConstraint => ({
    name: 'walkable',
    check: (ctx: PlacementContext, x: number, y: number) => {
      const terrain = ctx.getTerrain(x, y);
      const feature = ctx.getFeature(x, y);
      return isWalkableTile(terrain, feature);
    },
  }),

  walkableTerrain: (): NamedConstraint => ({
    name: 'walkableTerrain',
    check: (ctx: PlacementContext, x: number, y: number) =>
      !UNWALKABLE_TERRAINS.includes(ctx.getTerrain(x, y)),
  }),

  areaWalkable: (radius: number): NamedConstraint => ({
    name: `areaWalkable(${radius})`,
    check: (ctx: PlacementContext, x: number, y: number) => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (!ctx.isInBounds(nx, ny)) return false;
          const t = ctx.getTerrain(nx, ny);
          const f = ctx.getFeature(nx, ny);
          if (!isWalkableTile(t, f)) return false;
        }
      }
      return true;
    },
  }),

  areaTerrainWalkable: (radius: number): NamedConstraint => ({
    name: `areaTerrainWalkable(${radius})`,
    check: (ctx: PlacementContext, x: number, y: number) => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (!ctx.isInBounds(nx, ny)) return false;
          if (UNWALKABLE_TERRAINS.includes(ctx.getTerrain(nx, ny))) return false;
        }
      }
      return true;
    },
  }),

  awayFrom: (positions: Position[], minDistance: number): NamedConstraint => ({
    name: `awayFrom(${minDistance})`,
    check: (_ctx: PlacementContext, x: number, y: number) =>
      positions.every(
        (p) => Math.abs(p.x - x) >= minDistance || Math.abs(p.y - y) >= minDistance
      ),
  }),

  nearTo: (position: Position, maxDistance: number): NamedConstraint => ({
    name: `nearTo(${maxDistance})`,
    check: (_ctx: PlacementContext, x: number, y: number) =>
      Math.abs(position.x - x) <= maxDistance && Math.abs(position.y - y) <= maxDistance,
  }),

  probability: (chance: number, random: () => number): NamedConstraint => ({
    name: `probability(${chance})`,
    check: () => random() < chance,
  }),
} as const;

export { isWalkableTile, WALKABLE_TERRAINS, WALKABLE_FEATURES, BLOCKING_FEATURES, UNWALKABLE_TERRAINS };
