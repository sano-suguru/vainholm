import type { Enemy } from './types';
import { useGameStore } from '../stores/gameStore';
import { ENEMY_TYPES } from './enemyTypes';
import { getManhattanDistance, getDirectionToward } from './pathfinding';

export const processEnemyAI = (enemy: Enemy): void => {
  const store = useGameStore.getState();
  const { player, canMoveTo, getEnemyAt, updateEnemy, damagePlayer, addCombatLogEntry, tick } = store;
  
  if (!enemy.isAlive) return;
  
  const enemyDef = ENEMY_TYPES[enemy.type];
  const distance = getManhattanDistance(enemy.position, player.position);
  
  if (distance > enemyDef.detectionRange) return;
  
  if (distance === 1) {
    const damage = Math.max(1, enemy.stats.attack - player.stats.defense);
    damagePlayer(damage);
    addCombatLogEntry({
      tick,
      type: 'enemy_attack',
      message: `${enemyDef.name} attacks for ${damage} damage`,
      damage,
    });
    return;
  }
  
  const isOccupied = (x: number, y: number): boolean => {
    if (player.position.x === x && player.position.y === y) return true;
    return getEnemyAt(x, y) !== null;
  };
  
  const nextPos = getDirectionToward(
    enemy.position,
    player.position,
    canMoveTo,
    isOccupied
  );
  
  if (nextPos) {
    updateEnemy(enemy.id, { position: nextPos });
  }
};

export const processAllEnemies = (): void => {
  const { enemies } = useGameStore.getState();
  for (const enemy of enemies.values()) {
    processEnemyAI(enemy);
  }
};
