import type { Ally, Enemy } from './types';
import type { Position } from '../types';

import { combat_ally_attack_enemy, combat_ally_killed_enemy } from '../paraglide/messages.js';
import { useGameStore } from '../stores/gameStore';
import { useDamageNumberStore } from '../stores/damageNumberStore';
import { ALLY_TYPES } from './allyTypes';
import { getManhattanDistance, getDirectionToward } from './pathfinding';
import { applyDamageToEnemy } from './damageCalculation';
import { isOccupied, isOccupiedByAllyOrPlayer, findAdjacentEnemy } from './aiUtilities';
import { getLocalizedAllyName, getLocalizedEnemyName } from '../utils/i18n';

const MAX_PARTY_SIZE = 3;

export const canAddAlly = (): boolean => {
  const { allies } = useGameStore.getState();
  const aliveCount = Array.from(allies.values()).filter((a) => a.isAlive).length;
  return aliveCount < MAX_PARTY_SIZE;
};

export const getAllyCount = (): number => {
  const { allies } = useGameStore.getState();
  return Array.from(allies.values()).filter((a) => a.isAlive).length;
};

const findNearestEnemy = (position: Position): Enemy | null => {
  const { enemies } = useGameStore.getState();
  let nearest: Enemy | null = null;
  let nearestDist = Infinity;

  for (const enemy of enemies.values()) {
    if (!enemy.isAlive) continue;
    const dist = getManhattanDistance(position, enemy.position);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
};

const allyAttackEnemy = (ally: Ally, enemy: Enemy): void => {
  const store = useGameStore.getState();
  const { updateEnemy, removeEnemy, addCombatLogEntry, tick } = store;

  const weaponBonus = ally.equippedWeapon?.attackBonus ?? 0;
  const totalAttack = ally.stats.attack + weaponBonus;
  const damage = Math.max(1, totalAttack - enemy.stats.defense);

  const { newHp, isDead } = applyDamageToEnemy(enemy.stats.hp, damage);

  useDamageNumberStore.getState().addDamageNumber(
    enemy.position,
    damage,
    false,
    false
  );

  const allyDisplayName = getLocalizedAllyName(ally.type);
  const enemyDisplayName = getLocalizedEnemyName(enemy.type);

  updateEnemy(enemy.id, {
    stats: { ...enemy.stats, hp: newHp },
    isAlive: !isDead,
    isAware: true,
  });

  if (isDead) {
    addCombatLogEntry({
      tick,
      type: 'ally_attack',
      message: combat_ally_killed_enemy({ ally: allyDisplayName, enemy: enemyDisplayName }),
      damage,
    });
    removeEnemy(enemy.id);
  } else {
    addCombatLogEntry({
      tick,
      type: 'ally_attack',
      message: combat_ally_attack_enemy({ ally: allyDisplayName, enemy: enemyDisplayName, damage }),
      damage,
    });
  }
};

const processAggressiveMode = (ally: Ally): void => {
  const store = useGameStore.getState();
  const { canMoveTo, updateAlly } = store;
  const allyDef = ALLY_TYPES[ally.type];

  const adjacentEnemy = findAdjacentEnemy(ally.position);
  if (adjacentEnemy) {
    allyAttackEnemy(ally, adjacentEnemy);
    return;
  }

  const nearestEnemy = findNearestEnemy(ally.position);
  if (!nearestEnemy) return;

  const distance = getManhattanDistance(ally.position, nearestEnemy.position);
  if (distance > allyDef.detectionRange) return;

  const nextPos = getDirectionToward(
    ally.position,
    nearestEnemy.position,
    canMoveTo,
    isOccupied
  );

  if (nextPos) {
    updateAlly(ally.id, { position: nextPos });
  }
};

const processFollowMode = (ally: Ally): void => {
  const store = useGameStore.getState();
  const { player, canMoveTo, updateAlly } = store;
  const allyDef = ALLY_TYPES[ally.type];

  const adjacentEnemy = findAdjacentEnemy(ally.position);
  if (adjacentEnemy) {
    allyAttackEnemy(ally, adjacentEnemy);
    return;
  }

  const distanceToPlayer = getManhattanDistance(ally.position, player.position);

  if (distanceToPlayer <= allyDef.followDistance) {
    return;
  }

  const nextPos = getDirectionToward(
    ally.position,
    player.position,
    canMoveTo,
    isOccupiedByAllyOrPlayer
  );

  if (nextPos) {
    updateAlly(ally.id, { position: nextPos });
  }
};

const processWaitMode = (ally: Ally): void => {
  const adjacentEnemy = findAdjacentEnemy(ally.position);
  if (adjacentEnemy) {
    allyAttackEnemy(ally, adjacentEnemy);
  }
};

export const processAllyAI = (ally: Ally): void => {
  if (!ally.isAlive) return;

  const stunEffect = ally.statusEffects?.get('stun');
  if (stunEffect && stunEffect.duration > 0) return;

  // Slowed allies skip every other turn (50% action rate)
  const slowEffect = ally.statusEffects?.get('slow');
  if (slowEffect && slowEffect.duration > 0) {
    const tick = useGameStore.getState().tick;
    if (tick % 2 === 1) return;
  }

  switch (ally.behaviorMode) {
    case 'aggressive':
      processAggressiveMode(ally);
      break;
    case 'follow':
      processFollowMode(ally);
      break;
    case 'wait':
      processWaitMode(ally);
      break;
  }
};

export const processAllAllies = (): void => {
  const { allies } = useGameStore.getState();
  for (const ally of allies.values()) {
    processAllyAI(ally);
  }
};
