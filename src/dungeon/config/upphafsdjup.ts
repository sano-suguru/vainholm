import type { RegionConfig } from '../types';

export const UPPHAFSDJUP_CONFIG: RegionConfig = {
  theme: 'upphafsdjup',
  name: 'Upphafsdjúp',
  displayName: '起源の深淵',
  floors: 2,
  startFloor: 7,
  generatorStyle: 'bsp',
  floorTileType: 'void_floor',
  wallTileType: 'void_wall',
  size: {
    base: { width: 55, height: 55 },
    perFloor: {
      7: { width: 50, height: 50 },
      8: { width: 60, height: 60 },
    },
  },
  bspConfig: {
    minRoomSize: 7,
    maxRoomSize: 16,
    minRooms: 5,
    maxRooms: 8,
    corridorWidth: 3,
    allowLCorridors: true,
    roomMargin: 2,
    shortcutMaxDistance: 25,
    shortcutChance: 0.5,
    maxShortcuts: 4,
    extraBendChance: 0.6,
    maxExtraBends: 3,
  },
  decorationConfig: {
    roomDecorationChance: 0.7,
    minRoomSizeForStructures: 6,
    decorationTiles: {
      pillar: 0.20,
      altar_dark: 0.25,
      sarcophagus: 0.15,
      bone_pile: 0.20,
      rubble: 0.20,
    },
  },
  trapConfig: {
    trapChance: 0.5,
    trapsPerRoom: 3,
    trapTiles: {
      trap_pit: 0.40,
      trap_spike: 0.35,
      pressure_plate: 0.25,
    },
    distanceScaling: true,
    maxDistanceMultiplier: 1.8,
  },
  hazardConfig: {
    hazardChance: 0.6,
    hazardTiles: {
      cursed_ground: 0.35,
      miasma: 0.30,
      blight: 0.20,
      toxic_marsh: 0.15,
    },
    distanceScaling: true,
    maxDistanceMultiplier: 1.5,
  },
  lightingConfig: {
    lightingChance: 0.05,
    lightsPerRoom: 1,
    lightingTiles: {
      brazier: 0.7,
      wall_torch: 0.3,
    },
  },
  doorConfig: {
    doorChance: 0.4,
    lockedChance: 0.4,
    secretChance: 0.25,
  },
  multiTileConfig: {
    objectChance: 0.6,
    maxObjectsPerFloor: 5,
    objects: [
      { type: 'fallen_pillar', width: 2, height: 1, weight: 0.3 },
      { type: 'broken_statue', width: 2, height: 2, weight: 0.4 },
      { type: 'collapsed_arch', width: 3, height: 1, weight: 0.3 },
    ],
  },
  collapseConfig: {
    collapseChance: 0.8,
    minCollapseSize: 6,
    maxCollapseSize: 12,
    maxCollapseZones: 4,
    crackedFloorRadius: 3,
    floorScaling: true,
    maxFloorMultiplier: 2.0,
    affectWalls: true,
  },
};
