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
      chain: 0.05,
    },
  },
  trapConfig: {
    trapChance: 0.25,
    trapsPerRoom: 1,
    trapTiles: {
      trap_spike: 0.5,
      pressure_plate: 0.3,
      web: 0.2,
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
  hazardConfig: {
    hazardChance: 0.15,
    hazardTiles: {
      miasma: 0.4,
      cursed_ground: 0.4,
      blood: 0.2,
    },
  },
  doorConfig: {
    doorChance: 0.5,
    lockedChance: 0.2,
    secretChance: 0.1,
  },
};
