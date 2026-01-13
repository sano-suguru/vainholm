import { describe, test, expect } from 'vitest';
import {
  generateFloor,
  selectWeightedTile,
  shuffleArray,
  validateDoorConfig,
} from './floorGenerator';
import { HRODRGRAF_CONFIG } from '../config/hrodrgraf';
import { isReachable, countReachableTiles, countTotalWalkableTiles, mapToAscii } from '../testUtils';
import { TILE_ID_BY_TYPE } from '../../tiles';
import { seededRandom } from '../../utils/seedUtils';

function createFloorOptions(seed: number, level = 1) {
  return {
    level,
    regionConfig: HRODRGRAF_CONFIG,
    seed,
    previousStairsDown: null,
    isLastFloorInDungeon: false,
  };
}

describe('floorGenerator', () => {
  test('generates floor with spawn point and stairs', () => {
    const floor = generateFloor(createFloorOptions(12345));

    expect(floor.map.spawnPoint).toBeDefined();
    expect(floor.stairsDown).toBeDefined();
    expect(floor.rooms.length).toBeGreaterThanOrEqual(HRODRGRAF_CONFIG.bspConfig.minRooms);
  });

  test('spawn point is reachable to stairs_down', () => {
    const floor = generateFloor(createFloorOptions(12345));

    const reachable = isReachable(floor.map, floor.map.spawnPoint, floor.stairsDown!);

    if (!reachable) {
      console.log('Map ASCII:');
      console.log(mapToAscii(floor.map));
      console.log(`Spawn: (${floor.map.spawnPoint.x}, ${floor.map.spawnPoint.y})`);
      console.log(`Stairs: (${floor.stairsDown!.x}, ${floor.stairsDown!.y})`);
    }

    expect(reachable).toBe(true);
  });

  test('all walkable tiles are connected', () => {
    const floor = generateFloor(createFloorOptions(12345));

    const reachableCount = countReachableTiles(floor.map, floor.map.spawnPoint);
    const totalWalkable = countTotalWalkableTiles(floor.map);

    if (reachableCount !== totalWalkable) {
      console.log('Map ASCII:');
      console.log(mapToAscii(floor.map));
      console.log(`Reachable: ${reachableCount}, Total walkable: ${totalWalkable}`);
    }

    expect(reachableCount).toBe(totalWalkable);
  });

  test('works with multiple seeds', () => {
    const seeds = [1, 42, 100, 999, 12345, 54321];

    for (const seed of seeds) {
      const floor = generateFloor(createFloorOptions(seed));

      const reachable = isReachable(floor.map, floor.map.spawnPoint, floor.stairsDown!);

      if (!reachable) {
        console.log(`Seed ${seed} failed:`);
        console.log(mapToAscii(floor.map));
        console.log(`Spawn: (${floor.map.spawnPoint.x}, ${floor.map.spawnPoint.y})`);
        console.log(`Stairs: (${floor.stairsDown!.x}, ${floor.stairsDown!.y})`);
      }

      expect(reachable, `Seed ${seed}: spawn should reach stairs`).toBe(true);
    }
  });

  test('corridors connect rooms properly', () => {
    const floor = generateFloor(createFloorOptions(12345));

    expect(floor.corridors.length).toBeGreaterThan(0);

    for (const corridor of floor.corridors) {
      const hasBend = corridor.bend !== undefined;
      const hasBends = corridor.bends !== undefined && corridor.bends.length > 0;
      expect(hasBend || hasBends).toBe(true);
    }
  });

  test('assigns boss and treasure room types', () => {
    const floor = generateFloor(createFloorOptions(12345));

    const bossRoom = floor.rooms.find((r) => r.roomType === 'boss');
    const entranceRoom = floor.rooms.find((r) => r.roomType === 'entrance');
    const exitRoom = floor.rooms.find((r) => r.roomType === 'exit');

    expect(entranceRoom).toBeDefined();
    expect(exitRoom).toBeDefined();
    expect(bossRoom).toBeDefined();

    if (bossRoom) {
      const normalRooms = floor.rooms.filter(
        (r) => r.roomType !== 'entrance' && r.roomType !== 'exit'
      );
      const bossArea = bossRoom.width * bossRoom.height;
      const allAreas = normalRooms.map((r) => r.width * r.height);
      expect(bossArea).toBe(Math.max(...allAreas));
    }
  });

  test('places features on the map', () => {
    const floor = generateFloor(createFloorOptions(12345));
    const featuresLayer = floor.map.layers[1];

    let featureCount = 0;
    for (let y = 0; y < floor.map.height; y++) {
      for (let x = 0; x < floor.map.width; x++) {
        if (featuresLayer.data[y][x] !== 0) {
          featureCount++;
        }
      }
    }

    expect(featureCount).toBeGreaterThan(2);
  });

  test('deterministic generation with same seed', () => {
    const floor1 = generateFloor(createFloorOptions(99999));
    const floor2 = generateFloor(createFloorOptions(99999));

    expect(floor1.rooms.length).toBe(floor2.rooms.length);
    expect(floor1.corridors.length).toBe(floor2.corridors.length);

    for (let i = 0; i < floor1.rooms.length; i++) {
      expect(floor1.rooms[i].x).toBe(floor2.rooms[i].x);
      expect(floor1.rooms[i].y).toBe(floor2.rooms[i].y);
      expect(floor1.rooms[i].roomType).toBe(floor2.rooms[i].roomType);
    }

    expect(floor1.map.layers[0].data).toEqual(floor2.map.layers[0].data);
    expect(floor1.map.layers[1].data).toEqual(floor2.map.layers[1].data);
  });
});

describe('selectWeightedTile', () => {
  test('returns null for empty tiles', () => {
    const random = seededRandom(12345);
    expect(selectWeightedTile({}, random)).toBeNull();
  });

  test('returns null when all weights are 0', () => {
    const random = seededRandom(12345);
    expect(selectWeightedTile({ pillar: 0, rubble: 0 }, random)).toBeNull();
  });

  test('returns the only tile when single entry', () => {
    const random = seededRandom(12345);
    expect(selectWeightedTile({ pillar: 1 }, random)).toBe(TILE_ID_BY_TYPE.pillar);
  });

  test('respects weight distribution', () => {
    const counts = { pillar: 0, rubble: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const random = seededRandom(i);
      const result = selectWeightedTile({ pillar: 0.7, rubble: 0.3 }, random);
      if (result === TILE_ID_BY_TYPE.pillar) counts.pillar++;
      if (result === TILE_ID_BY_TYPE.rubble) counts.rubble++;
    }

    expect(counts.pillar).toBeGreaterThan(counts.rubble);
    expect(counts.pillar / iterations).toBeGreaterThan(0.5);
  });
});

describe('shuffleArray', () => {
  test('returns same length array', () => {
    const random = seededRandom(12345);
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input, random);
    expect(result.length).toBe(input.length);
  });

  test('contains all original elements', () => {
    const random = seededRandom(12345);
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input, random);
    expect(result.sort()).toEqual(input.sort());
  });

  test('does not mutate original array', () => {
    const random = seededRandom(12345);
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffleArray(input, random);
    expect(input).toEqual(original);
  });

  test('is deterministic with same seed', () => {
    const result1 = shuffleArray([1, 2, 3, 4, 5], seededRandom(42));
    const result2 = shuffleArray([1, 2, 3, 4, 5], seededRandom(42));
    expect(result1).toEqual(result2);
  });
});

describe('validateDoorConfig', () => {
  test('throws when secretChance + lockedChance > 1', () => {
    expect(() => validateDoorConfig({
      doorChance: 0.5,
      secretChance: 0.6,
      lockedChance: 0.5,
    })).toThrow('exceeds 1');
  });

  test('does not throw when secretChance + lockedChance equals 1', () => {
    expect(() => validateDoorConfig({
      doorChance: 0.5,
      secretChance: 0.5,
      lockedChance: 0.5,
    })).not.toThrow();
  });

  test('does not throw when sum < 1', () => {
    expect(() => validateDoorConfig({
      doorChance: 0.5,
      secretChance: 0.2,
      lockedChance: 0.3,
    })).not.toThrow();
  });
});
