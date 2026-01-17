import type { Enemy, EnemyTypeId } from './types';
import type { Position } from '../types';
import type { EnemyRegion } from './enemyTypes';
import { createEnemyStats, selectRandomEnemy } from './enemyTypes';
import { isEnemyRegion } from './enemyTypes';
import { useGameStore } from '../stores/gameStore';
import { useDungeonStore } from '../dungeon/dungeonStore';

let enemyIdCounter = 0;

const generateEnemyId = (): string => {
  enemyIdCounter += 1;
  return `enemy_${enemyIdCounter}`;
};

export const createEnemy = (type: EnemyTypeId, position: Position): Enemy => {
  return {
    id: generateEnemyId(),
    type,
    position,
    stats: createEnemyStats(type),
    isAlive: true,
    isAware: false,
  };
};

const DEFAULT_REGION: EnemyRegion = 'hrodrgraf';

export const spawnEnemiesForFloor = (
  floorNumber: number,
  walkableTiles: Position[],
  playerSpawn: Position
): void => {
  const store = useGameStore.getState();
  store.clearEnemies();
  
  const dungeonStore = useDungeonStore.getState();
  const regionConfig = dungeonStore.getCurrentRegion();
  const theme = regionConfig?.theme;
  const region: EnemyRegion = theme !== undefined && isEnemyRegion(theme) ? theme : DEFAULT_REGION;
  
  const rng = Math.random;
  
  const minDistance = 5;
  const validTiles = walkableTiles.filter((tile) => {
    const dx = tile.x - playerSpawn.x;
    const dy = tile.y - playerSpawn.y;
    return Math.abs(dx) + Math.abs(dy) >= minDistance;
  });
  
  const baseCount = 3;
  const floorBonus = floorNumber;
  const enemyCount = Math.min(baseCount + floorBonus, validTiles.length);
  
  const shuffled = [...validTiles].sort(() => rng() - 0.5);
  const spawnPositions = shuffled.slice(0, enemyCount);
  
  for (const pos of spawnPositions) {
    const enemyType = selectRandomEnemy(floorNumber, region, rng);
    const enemy = createEnemy(enemyType, pos);
    store.addEnemy(enemy);
  }
};

export const resetEnemyIdCounter = (): void => {
  enemyIdCounter = 0;
};
