import type { RegionConfig } from '../types';

export const HRODRGRAF_CONFIG: RegionConfig = {
  theme: 'hrodrgraf',
  name: 'Hróðrgraf',
  displayName: '栄光の墓',
  floors: 3,
  startFloor: 1,
  generatorStyle: 'bsp',
  size: {
    base: { width: 40, height: 40 },
    perFloor: {
      1: { width: 35, height: 35 },
      3: { width: 45, height: 45 },
    },
  },
  bspConfig: {
    minRoomSize: 5,
    maxRoomSize: 10,
    minRooms: 6,
    maxRooms: 10,
    corridorWidth: 2,
    allowLCorridors: true,
    roomMargin: 1,
    shortcutMaxDistance: 15,
    shortcutChance: 0.3,
    maxShortcuts: 2,
    extraBendChance: 0.25,
    maxExtraBends: 1,
  },
  decorationConfig: {
    roomDecorationChance: 0.5,
    minRoomSizeForStructures: 4,
    decorationTiles: {
      pillar: 0.25,
      rubble: 0.25,
      bone_pile: 0.20,
      sarcophagus: 0.15,
      altar_dark: 0.10,
      lichen: 0.05,
    },
  },

  lightingConfig: {
    lightingChance: 0.15,
    lightsPerRoom: 1,
    lightingTiles: {
      brazier: 0.4,
      wall_torch: 0.6,
    },
  },

  doorConfig: {
    doorChance: 0.5,
    lockedChance: 0.2,
    secretChance: 0.1,
  },
  multiTileConfig: {
    objectChance: 0.5,
    maxObjectsPerFloor: 4,
    objects: [
      { type: 'fallen_pillar', width: 2, height: 1, weight: 0.5 },
      { type: 'broken_statue', width: 2, height: 2, weight: 0.5 },
    ],
  },
  collapseConfig: {
    collapseChance: 0.6,
    minCollapseSize: 5,
    maxCollapseSize: 8,
    maxCollapseZones: 2,
    crackedFloorRadius: 2,
    floorScaling: true,
    maxFloorMultiplier: 1.5,
    affectWalls: true,
  },
};
