import type { AllyTypeId, CombatStats } from './types';

export interface AllyTypeDefinition {
  id: AllyTypeId;
  name: string;
  baseStats: CombatStats;
  followDistance: number;
  detectionRange: number;
}

export const ALLY_TYPES: Record<AllyTypeId, AllyTypeDefinition> = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    baseStats: {
      hp: 12,
      maxHp: 12,
      attack: 4,
      defense: 1,
    },
    followDistance: 2,
    detectionRange: 5,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    baseStats: {
      hp: 8,
      maxHp: 8,
      attack: 5,
      defense: 0,
    },
    followDistance: 3,
    detectionRange: 7,
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    baseStats: {
      hp: 15,
      maxHp: 15,
      attack: 4,
      defense: 2,
    },
    followDistance: 2,
    detectionRange: 5,
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    baseStats: {
      hp: 14,
      maxHp: 14,
      attack: 7,
      defense: 0,
    },
    followDistance: 3,
    detectionRange: 8,
  },
  shade: {
    id: 'shade',
    name: 'Shade',
    baseStats: {
      hp: 6,
      maxHp: 6,
      attack: 6,
      defense: 1,
    },
    followDistance: 2,
    detectionRange: 6,
  },
  hollow_knight: {
    id: 'hollow_knight',
    name: 'Hollow Knight',
    baseStats: {
      hp: 25,
      maxHp: 25,
      attack: 6,
      defense: 4,
    },
    followDistance: 2,
    detectionRange: 5,
  },
  survivor: {
    id: 'survivor',
    name: 'Survivor',
    baseStats: {
      hp: 20,
      maxHp: 20,
      attack: 5,
      defense: 2,
    },
    followDistance: 2,
    detectionRange: 4,
  },
};

export const createAllyStats = (typeId: AllyTypeId): CombatStats => {
  const definition = ALLY_TYPES[typeId];
  return { ...definition.baseStats };
};
