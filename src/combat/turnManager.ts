import { useGameStore } from '../stores/gameStore';
import type { TurnPhase, StatusEffectId, StatusEffect, EnemyId, Enemy } from './types';
import { processAllEnemies } from './enemyAI';
import { processBossAI } from './bossAI';
import { STATUS_EFFECTS } from './statusEffects';

export const executeTurn = (): void => {
  const store = useGameStore.getState();
  
  if (store.gameEndState !== 'playing') {
    return;
  }

  const slowEffect = store.player.statusEffects.get('slow');
  const isPlayerSlowed = slowEffect !== undefined && slowEffect.duration > 0;
  const enemyActionCount = isPlayerSlowed ? 2 : 1;

  for (let i = 0; i < enemyActionCount; i++) {
    store.setTurnPhase('enemy');
    processAllEnemies();
    
    const currentBoss = store.currentBoss;
    if (currentBoss?.isAlive) {
      processBossAI(currentBoss);
    }
  }
  
  store.setTurnPhase('effects');
  processEffects();
  store.setTurnPhase('player');
  store.incrementTick();
};

const processPlayerStatusEffects = (
  statusEffects: Map<StatusEffectId, StatusEffect>,
  damagePlayer: (amount: number) => void,
  setStatusEffects: (effects: Map<StatusEffectId, StatusEffect>) => void
): StatusEffectId[] => {
  if (statusEffects.size === 0) {
    return [];
  }

  const effectsToRemove: StatusEffectId[] = [];
  const newEffects = new Map<StatusEffectId, StatusEffect>();
  let hasStatusUpdates = false;

  for (const [effectId, effect] of statusEffects) {
    const definition = STATUS_EFFECTS[effectId];
    if (!definition) {
      effectsToRemove.push(effectId);
      hasStatusUpdates = true;
      continue;
    }

    if (definition.effect.type === 'damage_over_time') {
      const damage = definition.effect.damagePerTurn * effect.stacks;
      damagePlayer(damage);
    }

    const newDuration = effect.duration - 1;
    if (newDuration <= 0) {
      effectsToRemove.push(effectId);
      hasStatusUpdates = true;
      continue;
    }

    if (newDuration !== effect.duration) {
      hasStatusUpdates = true;
    }

    newEffects.set(effectId, { ...effect, duration: newDuration });
  }

  if (hasStatusUpdates) {
    setStatusEffects(newEffects);
  }

  return effectsToRemove;
};

const processEnemyStatusEffects = (
  enemy: Enemy,
  updateEnemy: (id: EnemyId, updates: Partial<Enemy>) => void
): void => {
  if (!enemy.isAlive || !enemy.statusEffects) return;
  
  const statusEffects = enemy.statusEffects;
  let totalDamage = 0;
  let hasStatusUpdates = false;
  const newEffects = new Map<StatusEffectId, StatusEffect>();

  for (const [effectId, effect] of statusEffects) {
    const definition = STATUS_EFFECTS[effectId];
    if (!definition) {
      hasStatusUpdates = true;
      continue;
    }

    if (definition.effect.type === 'damage_over_time') {
      totalDamage += definition.effect.damagePerTurn * effect.stacks;
    }

    const newDuration = effect.duration - 1;
    if (newDuration <= 0) {
      hasStatusUpdates = true;
      continue;
    }

    if (newDuration !== effect.duration) {
      hasStatusUpdates = true;
    }

    newEffects.set(effectId, { ...effect, duration: newDuration });
  }

  if (newEffects.size !== statusEffects.size) {
    hasStatusUpdates = true;
  }

  const nextEffects = newEffects.size > 0 ? newEffects : undefined;

  if (totalDamage > 0) {
    const newHp = Math.max(0, enemy.stats.hp - totalDamage);
    updateEnemy(enemy.id, {
      stats: { ...enemy.stats, hp: newHp },
      isAlive: newHp > 0,
      statusEffects: nextEffects,
    });
  } else if (hasStatusUpdates) {
    updateEnemy(enemy.id, { statusEffects: nextEffects });
  }
};

const processEffects = (): void => {
  const store = useGameStore.getState();
  const { player, enemies, damagePlayer, updateEnemy, recalculateVisibility } = store;

  const removedEffects = processPlayerStatusEffects(
    player.statusEffects,
    damagePlayer,
    (effects) => store.updatePlayerStatusEffects(effects)
  );
  
  if (removedEffects.includes('blind')) {
    recalculateVisibility();
  }
  
  for (const enemy of enemies.values()) {
    if (!enemy.isAlive || !enemy.statusEffects) continue;
    processEnemyStatusEffects(enemy, updateEnemy);
  }
};

export const isEnemyStunned = (enemy: Enemy): boolean => {
  if (!enemy.statusEffects) return false;
  const stunEffect = enemy.statusEffects.get('stun');
  return stunEffect !== undefined && stunEffect.duration > 0;
};

export const isPlayerStunned = (): boolean => {
  const { player } = useGameStore.getState();
  const stunEffect = player.statusEffects.get('stun');
  return stunEffect !== undefined && stunEffect.duration > 0;
};

export const getTurnPhase = (): TurnPhase => {
  return useGameStore.getState().turnPhase;
};

export const isPlayerTurn = (): boolean => {
  return useGameStore.getState().turnPhase === 'player';
};
