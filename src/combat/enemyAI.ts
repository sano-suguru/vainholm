import type { Ally, Enemy } from './types';

import { combat_enemy_attack, combat_enemy_attack_ally, combat_ally_died } from '../paraglide/messages.js';
import { useGameStore } from '../stores/gameStore';
import { useDamageNumberStore } from '../stores/damageNumberStore';
import { ENEMY_TYPES } from './enemyTypes';
import { getManhattanDistance, getDirectionToward } from './pathfinding';
import { getLocalizedEnemyName, getLocalizedAllyName } from '../utils/i18n';
import { isEnemyStunned } from './turnManager';
import { isOccupied, findAdjacentAlly } from './aiUtilities';

const attackAlly = (enemy: Enemy, ally: Ally): void => {
  const store = useGameStore.getState();
  const { updateAlly, removeAlly, addCombatLogEntry, tick } = store;

  const armorBonus = ally.equippedArmor?.defenseBonus ?? 0;
  const totalDefense = ally.stats.defense + armorBonus;
  const damage = Math.max(1, enemy.stats.attack - totalDefense);
  const newHp = Math.max(0, ally.stats.hp - damage);
  const isDead = newHp <= 0;

  useDamageNumberStore.getState().addDamageNumber(
    ally.position,
    damage,
    false,
    false
  );

  const enemyName = getLocalizedEnemyName(enemy.type);
  const allyDisplayName = getLocalizedAllyName(ally.type);

  if (isDead) {
    addCombatLogEntry({
      tick,
      type: 'enemy_attack_ally',
      message: combat_enemy_attack_ally({ enemy: enemyName, ally: allyDisplayName, damage }),
      damage,
    });
    addCombatLogEntry({
      tick,
      type: 'ally_death',
      message: combat_ally_died({ ally: allyDisplayName }),
    });
    // Set isAlive: false before removal for consistency with turnManager.ts death handling
    updateAlly(ally.id, {
      stats: { ...ally.stats, hp: 0 },
      isAlive: false,
    });
    removeAlly(ally.id);
  } else {
    updateAlly(ally.id, {
      stats: { ...ally.stats, hp: newHp },
    });
    addCombatLogEntry({
      tick,
      type: 'enemy_attack_ally',
      message: combat_enemy_attack_ally({ enemy: enemyName, ally: allyDisplayName, damage }),
      damage,
    });
  }
};

export const processEnemyAI = (enemy: Enemy): void => {
  const store = useGameStore.getState();
  const { player, canMoveTo, updateEnemy, damagePlayer, addCombatLogEntry, tick } = store;
  
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
  
  const adjacentAlly = findAdjacentAlly(enemy.position);
  const playerAdjacent = distance === 1;
  
  // DESIGN: When both player and ally are adjacent, target the lower HP target.
  // If same HP, alternate based on tick (deterministic). This creates tactical depth.
  if (playerAdjacent && adjacentAlly) {
    const playerHpRatio = player.stats.hp / player.stats.maxHp;
    const allyHpRatio = adjacentAlly.stats.hp / adjacentAlly.stats.maxHp;
    const targetPlayer = playerHpRatio < allyHpRatio || (playerHpRatio === allyHpRatio && tick % 2 === 0);
    if (targetPlayer) {
      const damage = Math.max(1, enemy.stats.attack - player.stats.defense);
      damagePlayer(damage);
      const enemyName = getLocalizedEnemyName(enemy.type);
      addCombatLogEntry({
        tick,
        type: 'enemy_attack',
        message: combat_enemy_attack({ enemy: enemyName, damage }),
        damage,
      });
    } else {
      attackAlly(enemy, adjacentAlly);
    }
    return;
  }
  
  if (adjacentAlly) {
    attackAlly(enemy, adjacentAlly);
    return;
  }
  
  if (playerAdjacent) {
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
