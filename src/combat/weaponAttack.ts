import type { Position } from '../types';
import type { Weapon, WeaponTypeId, CombatStats, DamageResult } from './types';
import { WEAPON_PATTERNS } from './weapons';
import { calculateDamage } from './damageCalculation';

export interface AttackResult {
  targets: AttackTarget[];
  knockbackTargets: KnockbackTarget[];
}

export interface AttackTarget {
  position: Position;
  damageResult: DamageResult;
}

export interface KnockbackTarget {
  from: Position;
  to: Position;
}

const DIRECTIONS_8: Position[] = [
  { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
  { x: -1, y: 0 },                   { x: 1, y: 0 },
  { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
];

export const getAttackTargets = (
  attackerPos: Position,
  targetPos: Position,
  weapon: Weapon | null,
  _isStealthAttack: boolean
): Position[] => {
  const weaponType: WeaponTypeId = weapon?.typeId ?? 'sword';
  const pattern = WEAPON_PATTERNS[weaponType];
  const attackType = pattern.attackType;

  switch (attackType.type) {
    case 'standard':
      return [targetPos];

    case 'cleave':
      return DIRECTIONS_8.map((dir) => ({
        x: attackerPos.x + dir.x,
        y: attackerPos.y + dir.y,
      }));

    case 'pierce': {
      const dx = Math.sign(targetPos.x - attackerPos.x);
      const dy = Math.sign(targetPos.y - attackerPos.y);
      const targets: Position[] = [];
      for (let i = 1; i <= attackType.range; i++) {
        targets.push({
          x: attackerPos.x + dx * i,
          y: attackerPos.y + dy * i,
        });
      }
      return targets;
    }

    case 'stealth_bonus':
    case 'knockback':
      return [targetPos];

    default:
      return [targetPos];
  }
};

export const calculateWeaponDamage = (
  attackerStats: CombatStats,
  defenderStats: CombatStats,
  weapon: Weapon | null,
  isStealthAttack: boolean
): DamageResult => {
  const weaponType: WeaponTypeId = weapon?.typeId ?? 'sword';
  const pattern = WEAPON_PATTERNS[weaponType];
  const attackType = pattern.attackType;

  const modifiedAttacker = { ...attackerStats };

  if (weapon) {
    modifiedAttacker.attack += weapon.attackBonus;
  }

  if (attackType.type === 'stealth_bonus' && isStealthAttack) {
    modifiedAttacker.attack = Math.floor(modifiedAttacker.attack * attackType.multiplier);
  }

  return calculateDamage(modifiedAttacker, defenderStats);
};

export const getKnockbackPosition = (
  attackerPos: Position,
  targetPos: Position,
  weapon: Weapon | null,
  canMoveTo: (x: number, y: number) => boolean
): Position | null => {
  const weaponType: WeaponTypeId = weapon?.typeId ?? 'sword';
  const pattern = WEAPON_PATTERNS[weaponType];
  const attackType = pattern.attackType;

  if (attackType.type !== 'knockback') {
    return null;
  }

  const dx = Math.sign(targetPos.x - attackerPos.x);
  const dy = Math.sign(targetPos.y - attackerPos.y);

  for (let i = attackType.distance; i >= 1; i--) {
    const newX = targetPos.x + dx * i;
    const newY = targetPos.y + dy * i;
    if (canMoveTo(newX, newY)) {
      return { x: newX, y: newY };
    }
  }

  return null;
};
