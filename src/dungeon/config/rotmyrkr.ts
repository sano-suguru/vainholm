import type { RegionConfig } from '../types';

export const ROTMYRKR_CONFIG: RegionConfig = {
  theme: 'rotmyrkr',
  name: 'Rótmyrkr',
  displayName: '根の闇',
  floors: 2,
  startFloor: 3,
  generatorStyle: 'bsp',
  size: {
    base: { width: 45, height: 45 },
    perFloor: {
      3: { width: 40, height: 40 },
      4: { width: 50, height: 50 },
    },
  },
  bspConfig: {
    minRoomSize: 6,
    maxRoomSize: 12,
    minRooms: 5,
    maxRooms: 9,
    corridorWidth: 2,
    allowLCorridors: true,
    roomMargin: 2,
    shortcutMaxDistance: 20,
    shortcutChance: 0.4,
    maxShortcuts: 3,
    extraBendChance: 0.4,
    maxExtraBends: 2,
  },
  decorationConfig: {
    roomDecorationChance: 0.6,
    minRoomSizeForStructures: 5,
    decorationTiles: {
      lichen: 0.30,
      rubble: 0.20,
      bone_pile: 0.15,
      pillar: 0.15,
      web: 0.20,
    },
  },
  trapConfig: {
    trapChance: 0.4,
    trapsPerRoom: 2,
    trapTiles: {
      web: 0.40,
      trap_pit: 0.30,
      trap_spike: 0.30,
    },
    distanceScaling: true,
    maxDistanceMultiplier: 1.5,
  },
  hazardConfig: {
    hazardChance: 0.5,
    hazardTiles: {
      toxic_marsh: 0.40,
      miasma: 0.30,
      blight: 0.30,
    },
    distanceScaling: true,
    maxDistanceMultiplier: 1.3,
  },
  lightingConfig: {
    lightingChance: 0.08,
    lightsPerRoom: 1,
    lightingTiles: {
      brazier: 0.3,
      wall_torch: 0.7,
    },
  },
  doorConfig: {
    doorChance: 0.3,
    lockedChance: 0.15,
    secretChance: 0.2,
  },
};
