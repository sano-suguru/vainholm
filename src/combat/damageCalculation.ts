import type { CombatStats, DamageResult } from './types';

const CRITICAL_CHANCE = 0.1;
const CRITICAL_MULTIPLIER = 2;
const MIN_DAMAGE = 1;

export const calculateDamage = (
  attackerStats: CombatStats,
  defenderStats: CombatStats
): DamageResult => {
  const isCritical = Math.random() < CRITICAL_CHANCE;
  const baseAttack = isCritical
    ? attackerStats.attack * CRITICAL_MULTIPLIER
    : attackerStats.attack;
  
  const damage = Math.max(MIN_DAMAGE, baseAttack - defenderStats.defense);
  const isLethal = defenderStats.hp - damage <= 0;

  return { damage, isCritical, isLethal };
};

export const applyDamageToEnemy = (
  currentHp: number,
  damage: number
): { newHp: number; isDead: boolean } => {
  const newHp = Math.max(0, currentHp - damage);
  return { newHp, isDead: newHp <= 0 };
};
