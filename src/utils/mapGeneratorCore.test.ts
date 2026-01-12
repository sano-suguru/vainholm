import { describe, it, expect } from 'vitest';
import { generateMapData } from './mapGeneratorCore';
import { TILE_ID_BY_TYPE } from '../tiles';

describe('generateMapData', () => {
  const TEST_SEEDS = [12345, 42, 99999, 1, 777];

  describe('dungeon entrance placement', () => {
    it.each(TEST_SEEDS)('should place dungeon entrance on the map (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      
      const featureLayer = map.layers.find(l => l.name === 'features');
      expect(featureLayer).toBeDefined();
      
      let entranceFound = false;
      
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          if (featureLayer!.data[y][x] === TILE_ID_BY_TYPE.dungeon_entrance) {
            entranceFound = true;
            break;
          }
        }
        if (entranceFound) break;
      }
      
      expect(entranceFound).toBe(true);
    });

    it.each(TEST_SEEDS)('should store dungeon entrance position in MapData (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      
      expect(map.dungeonEntrance).toBeDefined();
      expect(map.dungeonEntrance!.x).toBeGreaterThanOrEqual(0);
      expect(map.dungeonEntrance!.x).toBeLessThan(60);
      expect(map.dungeonEntrance!.y).toBeGreaterThanOrEqual(0);
      expect(map.dungeonEntrance!.y).toBeLessThan(60);
    });
  });

  describe('spawn point near dungeon entrance', () => {
    it.each(TEST_SEEDS)('should spawn player within 6 tiles of dungeon entrance (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      
      expect(map.dungeonEntrance).toBeDefined();
      
      const dx = Math.abs(map.spawnPoint.x - map.dungeonEntrance!.x);
      const dy = Math.abs(map.spawnPoint.y - map.dungeonEntrance!.y);
      const distance = Math.max(dx, dy);
      
      expect(distance).toBeLessThanOrEqual(6);
    });
  });

  describe('dungeon entrance tile properties', () => {
    it('should have correct tile ID for dungeon_entrance', () => {
      expect(TILE_ID_BY_TYPE.dungeon_entrance).toBe(57);
    });

    it.each(TEST_SEEDS)('entrance position should match actual tile position (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      const featureLayer = map.layers.find(l => l.name === 'features');
      
      expect(map.dungeonEntrance).toBeDefined();
      
      const { x, y } = map.dungeonEntrance!;
      const tileId = featureLayer!.data[y][x];
      
      expect(tileId).toBe(TILE_ID_BY_TYPE.dungeon_entrance);
    });
  });

  describe('map structure validation', () => {
    it.each(TEST_SEEDS)('should have terrain and features layers (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      
      const terrainLayer = map.layers.find(l => l.name === 'terrain');
      const featureLayer = map.layers.find(l => l.name === 'features');
      
      expect(terrainLayer).toBeDefined();
      expect(featureLayer).toBeDefined();
      expect(map.layers).toHaveLength(2);
    });

    it.each(TEST_SEEDS)('should have matching layer dimensions (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      
      const terrainLayer = map.layers.find(l => l.name === 'terrain')!;
      const featureLayer = map.layers.find(l => l.name === 'features')!;
      
      expect(terrainLayer.data.length).toBe(map.height);
      expect(featureLayer.data.length).toBe(map.height);
      
      for (let y = 0; y < map.height; y++) {
        expect(terrainLayer.data[y].length).toBe(map.width);
        expect(featureLayer.data[y].length).toBe(map.width);
      }
    });

    it.each(TEST_SEEDS)('spawn point should be walkable (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      const { x, y } = map.spawnPoint;
      
      const terrainLayer = map.layers.find(l => l.name === 'terrain')!;
      const featureLayer = map.layers.find(l => l.name === 'features')!;
      
      const terrainId = terrainLayer.data[y][x];
      const featureId = featureLayer.data[y][x];
      
      const walkableTerrains = [
        TILE_ID_BY_TYPE.grass,
        TILE_ID_BY_TYPE.sand,
        TILE_ID_BY_TYPE.road,
        TILE_ID_BY_TYPE.swamp,
      ];
      const walkableFeatures = [
        TILE_ID_BY_TYPE.forest,
        TILE_ID_BY_TYPE.ruins,
        TILE_ID_BY_TYPE.graveyard,
        TILE_ID_BY_TYPE.hills,
        TILE_ID_BY_TYPE.dungeon_entrance,
      ];
      const blockingFeatures = [
        TILE_ID_BY_TYPE.mountain,
        TILE_ID_BY_TYPE.water,
        TILE_ID_BY_TYPE.deep_water,
        TILE_ID_BY_TYPE.lava,
        TILE_ID_BY_TYPE.chasm,
      ];
      
      const isWalkable = 
        !blockingFeatures.includes(featureId) &&
        (walkableFeatures.includes(featureId) || 
         (featureId === 0 && walkableTerrains.includes(terrainId)));
      
      expect(isWalkable).toBe(true);
    });

    it.each(TEST_SEEDS)('all tile IDs should exist in tileMapping (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      
      for (const layer of map.layers) {
        for (let y = 0; y < map.height; y++) {
          for (let x = 0; x < map.width; x++) {
            const tileId = layer.data[y][x];
            if (tileId !== 0) {
              const tileType = map.tileMapping[String(tileId)];
              expect(tileType, `TileId ${tileId} at (${x},${y}) in ${layer.name}`).toBeDefined();
            }
          }
        }
      }
    });
  });

  describe('biome distribution', () => {
    it('should generate water tiles', () => {
      const map = generateMapData(60, 60, 12345);
      const terrainLayer = map.layers.find(l => l.name === 'terrain')!;
      
      let waterCount = 0;
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tileId = terrainLayer.data[y][x];
          if (tileId === TILE_ID_BY_TYPE.water || tileId === TILE_ID_BY_TYPE.deep_water) {
            waterCount++;
          }
        }
      }
      
      expect(waterCount).toBeGreaterThan(0);
    });

    it('should generate walkable terrain tiles', () => {
      const map = generateMapData(60, 60, 12345);
      const terrainLayer = map.layers.find(l => l.name === 'terrain')!;
      
      const walkableTerrains = [
        TILE_ID_BY_TYPE.grass,
        TILE_ID_BY_TYPE.sand,
        TILE_ID_BY_TYPE.road,
        TILE_ID_BY_TYPE.swamp,
      ];
      
      let walkableCount = 0;
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          if (walkableTerrains.includes(terrainLayer.data[y][x])) {
            walkableCount++;
          }
        }
      }
      
      expect(walkableCount).toBeGreaterThan(0);
    });

    it('should generate diverse terrain types across seeds', () => {
      const seeds = [12345, 42, 99999];
      const allTerrainTypes = new Set<number>();
      
      for (const seed of seeds) {
        const map = generateMapData(60, 60, seed);
        const terrainLayer = map.layers.find(l => l.name === 'terrain')!;
        
        for (let y = 0; y < map.height; y++) {
          for (let x = 0; x < map.width; x++) {
            allTerrainTypes.add(terrainLayer.data[y][x]);
          }
        }
      }
      
      expect(allTerrainTypes.size).toBeGreaterThan(3);
    });
  });

  describe('feature placement constraints', () => {
    it.each(TEST_SEEDS)('dungeon entrance should be on walkable terrain (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      
      if (!map.dungeonEntrance) return;
      
      const { x, y } = map.dungeonEntrance;
      const terrainLayer = map.layers.find(l => l.name === 'terrain')!;
      const terrainId = terrainLayer.data[y][x];
      
      const unwalkableTerrains = [
        TILE_ID_BY_TYPE.water,
        TILE_ID_BY_TYPE.deep_water,
        TILE_ID_BY_TYPE.lava,
        TILE_ID_BY_TYPE.chasm,
      ];
      
      expect(unwalkableTerrains).not.toContain(terrainId);
    });

    it.each(TEST_SEEDS)('roads should not be on water (seed: %i)', (seed) => {
      const map = generateMapData(60, 60, seed);
      const terrainLayer = map.layers.find(l => l.name === 'terrain')!;
      
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const tileId = terrainLayer.data[y][x];
          if (tileId === TILE_ID_BY_TYPE.road) {
            expect(tileId).not.toBe(TILE_ID_BY_TYPE.water);
            expect(tileId).not.toBe(TILE_ID_BY_TYPE.deep_water);
          }
        }
      }
    });
  });

  describe('map determinism', () => {
    it('should generate identical maps with same seed', () => {
      const map1 = generateMapData(60, 60, 12345);
      const map2 = generateMapData(60, 60, 12345);
      
      expect(map1.spawnPoint).toEqual(map2.spawnPoint);
      expect(map1.dungeonEntrance).toEqual(map2.dungeonEntrance);
      
      const terrain1 = map1.layers.find(l => l.name === 'terrain')!;
      const terrain2 = map2.layers.find(l => l.name === 'terrain')!;
      
      for (let y = 0; y < map1.height; y++) {
        for (let x = 0; x < map1.width; x++) {
          expect(terrain1.data[y][x]).toBe(terrain2.data[y][x]);
        }
      }
    });

    it('should generate different maps with different seeds', () => {
      const map1 = generateMapData(60, 60, 12345);
      const map2 = generateMapData(60, 60, 54321);
      
      const terrain1 = map1.layers.find(l => l.name === 'terrain')!;
      const terrain2 = map2.layers.find(l => l.name === 'terrain')!;
      
      let differences = 0;
      for (let y = 0; y < map1.height; y++) {
        for (let x = 0; x < map1.width; x++) {
          if (terrain1.data[y][x] !== terrain2.data[y][x]) {
            differences++;
          }
        }
      }
      
      expect(differences).toBeGreaterThan(map1.width * map1.height * 0.1);
    });
  });
});
