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
};
