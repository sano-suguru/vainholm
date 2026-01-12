import { describe, test, expect } from 'vitest';
import { generateFloor } from './floorGenerator';
import { HRODRGRAF_CONFIG } from '../config/hrodrgraf';
import { isReachable, countReachableTiles, countTotalWalkableTiles, mapToAscii } from '../testUtils';

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
      expect(corridor.bend).toBeDefined();
    }
  });
});
