import type { Enemy } from './types';

import { combat_enemy_attack } from '../paraglide/messages.js';
import { useGameStore } from '../stores/gameStore';
import { ENEMY_TYPES } from './enemyTypes';
import { getManhattanDistance, getDirectionToward } from './pathfinding';
import { getLocalizedEnemyName } from '../utils/i18n';
import { isEnemyStunned } from './turnManager';

export const processEnemyAI = (enemy: Enemy): void => {
  const store = useGameStore.getState();
  const { player, canMoveTo, getEnemyAt, updateEnemy, damagePlayer, addCombatLogEntry, tick } = store;
  
  if (!enemy.isAlive) return;
  if (isEnemyStunned(enemy)) return;
  
  const enemyDef = ENEMY_TYPES[enemy.type];
  const distance = getManhattanDistance(enemy.position, player.position);
  
  if (enemy.isAware) {
    if (distance > enemyDef.detectionRange) {
      updateEnemy(enemy.id, { isAware: false });
      return;
    }
  } else {
    if (distance <= enemyDef.detectionRange) {
      updateEnemy(enemy.id, { isAware: true });
    } else {
      return;
    }
  }
  
  if (distance === 1) {
    const damage = Math.max(1, enemy.stats.attack - player.stats.defense);
    damagePlayer(damage);
    const enemyName = getLocalizedEnemyName(enemy.type);
    addCombatLogEntry({
      tick,
      type: 'enemy_attack',
      message: combat_enemy_attack({ enemy: enemyName, damage }),
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
