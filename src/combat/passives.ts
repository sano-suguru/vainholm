import type { CharacterClassId, BackgroundId, CombatStats } from './types';
import { getClass } from './classes';
import { getBackground } from './backgrounds';
import { calculateDamage } from './damageCalculation';

export interface CounterAttackResult {
  triggered: boolean;
  damage: number;
}

export const checkCounterAttack = (
  classId: CharacterClassId,
  playerStats: CombatStats,
  enemyStats: CombatStats
): CounterAttackResult => {
  const charClass = getClass(classId);
  const passive = charClass.passiveAbility;

  if (passive.type !== 'counter_attack') {
    return { triggered: false, damage: 0 };
  }

  const triggered = Math.random() < passive.chance;
  if (!triggered) {
    return { triggered: false, damage: 0 };
  }

  const baseDamage = calculateDamage(playerStats, enemyStats);
  const damage = Math.floor(baseDamage.damage * passive.damageMultiplier);

  return { triggered: true, damage: Math.max(1, damage) };
};

export const shouldRevealTraps = (
  classId: CharacterClassId,
  playerX: number,
  playerY: number,
  trapX: number,
  trapY: number
): boolean => {
  const charClass = getClass(classId);
  const passive = charClass.passiveAbility;

  if (passive.type !== 'trap_sense') {
    return false;
  }

  const dx = Math.abs(playerX - trapX);
  const dy = Math.abs(playerY - trapY);
  const distance = Math.max(dx, dy);

  return distance <= passive.detectionRadius;
};

export const areItemsIdentified = (classId: CharacterClassId): boolean => {
  const charClass = getClass(classId);
  const passive = charClass.passiveAbility;

  return passive.type === 'item_identification' && passive.identified;
};

export const calculateTrapDamage = (
  backgroundId: BackgroundId,
  baseDamage: number
): number => {
  const background = getBackground(backgroundId);
  const effect = background.effect;

  if (effect.type === 'trap_damage_reduction') {
    return Math.floor(baseDamage * effect.multiplier);
  }

  return baseDamage;
};

export const calculateHealingAmount = (
  backgroundId: BackgroundId,
  baseHealing: number
): number => {
  const background = getBackground(backgroundId);
  const effect = background.effect;

  if (effect.type === 'healing_bonus') {
    return Math.floor(baseHealing * effect.multiplier);
  }

  return baseHealing;
};

export const calculateStealthDamageBonus = (
  backgroundId: BackgroundId
): number => {
  const background = getBackground(backgroundId);
  const effect = background.effect;

  if (effect.type === 'stealth_damage_bonus') {
    return effect.amount;
  }

  return 0;
};

export const getExtraStartingItems = (backgroundId: BackgroundId): number => {
  const background = getBackground(backgroundId);
  const effect = background.effect;

  if (effect.type === 'extra_starting_item') {
    return effect.count;
  }

  return 0;
};

export const getRemnantCostMultiplier = (backgroundId: BackgroundId): number => {
  const background = getBackground(backgroundId);
  const effect = background.effect;

  if (effect.type === 'remnant_cost_reduction') {
    return effect.multiplier;
  }

  return 1.0;
};
