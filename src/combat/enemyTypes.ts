import type { CombatStats, EnemyTypeId } from './types';

export interface EnemyTypeDefinition {
  id: EnemyTypeId;
  name: string;
  baseStats: CombatStats;
  detectionRange: number;
  moveSpeed: number;
}

export const ENEMY_TYPES: Record<EnemyTypeId, EnemyTypeDefinition> = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    baseStats: {
      hp: 15,
      maxHp: 15,
      attack: 4,
      defense: 1,
    },
    detectionRange: 6,
    moveSpeed: 1,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    baseStats: {
      hp: 10,
      maxHp: 10,
      attack: 6,
      defense: 0,
    },
    detectionRange: 8,
    moveSpeed: 1,
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    baseStats: {
      hp: 20,
      maxHp: 20,
      attack: 5,
      defense: 2,
    },
    detectionRange: 5,
    moveSpeed: 1,
  },
};

export const createEnemyStats = (typeId: EnemyTypeId): CombatStats => {
  const definition = ENEMY_TYPES[typeId];
  return { ...definition.baseStats };
};
