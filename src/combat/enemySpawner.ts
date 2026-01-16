import type { Enemy, EnemyTypeId } from './types';
import type { Position } from '../types';
import { createEnemyStats } from './enemyTypes';
import { useGameStore } from '../stores/gameStore';

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
  };
};

const ENEMY_SPAWN_WEIGHTS: Array<{ type: EnemyTypeId; weight: number }> = [
  { type: 'skeleton', weight: 50 },
  { type: 'ghost', weight: 30 },
  { type: 'cultist', weight: 20 },
];

const selectRandomEnemyType = (): EnemyTypeId => {
  const totalWeight = ENEMY_SPAWN_WEIGHTS.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const entry of ENEMY_SPAWN_WEIGHTS) {
    random -= entry.weight;
    if (random <= 0) {
      return entry.type;
    }
  }
  
  return 'skeleton';
};

export const spawnEnemiesForFloor = (
  floorNumber: number,
  walkableTiles: Position[],
  playerSpawn: Position
): void => {
  const store = useGameStore.getState();
  store.clearEnemies();
  
  const minDistance = 5;
  const validTiles = walkableTiles.filter((tile) => {
    const dx = tile.x - playerSpawn.x;
    const dy = tile.y - playerSpawn.y;
    return Math.abs(dx) + Math.abs(dy) >= minDistance;
  });
  
  const baseCount = 3;
  const floorBonus = floorNumber;
  const enemyCount = Math.min(baseCount + floorBonus, validTiles.length);
  
  const shuffled = [...validTiles].sort(() => Math.random() - 0.5);
  const spawnPositions = shuffled.slice(0, enemyCount);
  
  for (const pos of spawnPositions) {
    const enemyType = selectRandomEnemyType();
    const enemy = createEnemy(enemyType, pos);
    store.addEnemy(enemy);
  }
};

export const resetEnemyIdCounter = (): void => {
  enemyIdCounter = 0;
};
