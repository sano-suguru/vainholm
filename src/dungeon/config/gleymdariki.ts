import type { RegionConfig } from '../types';

export const GLEYMDARIKI_CONFIG: RegionConfig = {
  theme: 'gleymdariki',
  name: 'Gleymdaríki',
  displayName: '忘却の王国',
  floors: 2,
  startFloor: 5,
  generatorStyle: 'bsp',
  floorTileType: 'fortress_floor',
  wallTileType: 'fortress_wall',
  size: {
    base: { width: 50, height: 50 },
    perFloor: {
      5: { width: 45, height: 45 },
      6: { width: 55, height: 55 },
    },
  },
  bspConfig: {
    minRoomSize: 5,
    maxRoomSize: 14,
    minRooms: 7,
    maxRooms: 12,
    corridorWidth: 2,
    allowLCorridors: true,
    roomMargin: 1,
    shortcutMaxDistance: 12,
    shortcutChance: 0.25,
    maxShortcuts: 2,
    extraBendChance: 0.2,
    maxExtraBends: 1,
  },
  decorationConfig: {
    roomDecorationChance: 0.55,
    minRoomSizeForStructures: 5,
    decorationTiles: {
      pillar: 0.25,
      sarcophagus: 0.20,
      altar_dark: 0.15,
      rubble: 0.15,
      bone_pile: 0.15,
      lichen: 0.10,
    },
  },
  trapConfig: {
    trapChance: 0.35,
    trapsPerRoom: 2,
    trapTiles: {
      pressure_plate: 0.40,
      trap_spike: 0.35,
      trap_pit: 0.25,
    },
    distanceScaling: true,
    maxDistanceMultiplier: 1.4,
  },
  lightingConfig: {
    lightingChance: 0.12,
    lightsPerRoom: 2,
    lightingTiles: {
      brazier: 0.5,
      wall_torch: 0.5,
    },
  },
  doorConfig: {
    doorChance: 0.6,
    lockedChance: 0.3,
    secretChance: 0.15,
  },
  multiTileConfig: {
    objectChance: 0.4,
    maxObjectsPerFloor: 3,
    objects: [
      { type: 'fallen_pillar', width: 2, height: 1, weight: 0.4 },
      { type: 'broken_statue', width: 2, height: 2, weight: 0.4 },
      { type: 'collapsed_arch', width: 3, height: 1, weight: 0.2 },
    ],
  },
};
