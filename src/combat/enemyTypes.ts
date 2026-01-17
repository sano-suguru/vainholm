import type { BossTypeId, CombatStats, EnemyTypeId } from './types';

export type EnemyRegion = 'hrodrgraf' | 'rotmyrkr' | 'gleymdariki' | 'upphafsdjup';

export const isEnemyRegion = (value: string): value is EnemyRegion => {
  return value === 'hrodrgraf' || value === 'rotmyrkr' || value === 'gleymdariki' || value === 'upphafsdjup';
};

export interface EnemyTypeDefinition {
  id: EnemyTypeId;
  name: string;
  displayName: string;
  baseStats: CombatStats;
  detectionRange: number;
  moveSpeed: number;
  regions: EnemyRegion[];
  floorMin: number;
  floorMax: number;
  spawnWeight: number;
}

export const ENEMY_TYPES: Record<EnemyTypeId, EnemyTypeDefinition> = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    displayName: '骸骨',
    baseStats: {
      hp: 15,
      maxHp: 15,
      attack: 4,
      defense: 1,
    },
    detectionRange: 6,
    moveSpeed: 1,
    regions: ['hrodrgraf'],
    floorMin: 1,
    floorMax: 4,
    spawnWeight: 1.5,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    displayName: '亡霊',
    baseStats: {
      hp: 10,
      maxHp: 10,
      attack: 6,
      defense: 0,
    },
    detectionRange: 8,
    moveSpeed: 1,
    regions: ['hrodrgraf', 'gleymdariki'],
    floorMin: 1,
    floorMax: 6,
    spawnWeight: 1.0,
  },
  cultist: {
    id: 'cultist',
    name: 'Cultist',
    displayName: '信者',
    baseStats: {
      hp: 20,
      maxHp: 20,
      attack: 5,
      defense: 2,
    },
    detectionRange: 5,
    moveSpeed: 1,
    regions: ['hrodrgraf', 'rotmyrkr'],
    floorMin: 1,
    floorMax: 4,
    spawnWeight: 0.8,
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    displayName: '死霊',
    baseStats: {
      hp: 18,
      maxHp: 18,
      attack: 8,
      defense: 0,
    },
    detectionRange: 10,
    moveSpeed: 1,
    regions: ['gleymdariki', 'upphafsdjup'],
    floorMin: 5,
    floorMax: 8,
    spawnWeight: 0.7,
  },
  crawler: {
    id: 'crawler',
    name: 'Crawler',
    displayName: '這う者',
    baseStats: {
      hp: 12,
      maxHp: 12,
      attack: 5,
      defense: 3,
    },
    detectionRange: 4,
    moveSpeed: 1,
    regions: ['rotmyrkr'],
    floorMin: 3,
    floorMax: 6,
    spawnWeight: 1.2,
  },
  shade: {
    id: 'shade',
    name: 'Shade',
    displayName: '影',
    baseStats: {
      hp: 8,
      maxHp: 8,
      attack: 7,
      defense: 1,
    },
    detectionRange: 7,
    moveSpeed: 2,
    regions: ['rotmyrkr', 'upphafsdjup'],
    floorMin: 3,
    floorMax: 8,
    spawnWeight: 0.9,
  },
  hollow_knight: {
    id: 'hollow_knight',
    name: 'Hollow Knight',
    displayName: '虚ろの騎士',
    baseStats: {
      hp: 30,
      maxHp: 30,
      attack: 7,
      defense: 4,
    },
    detectionRange: 6,
    moveSpeed: 1,
    regions: ['gleymdariki'],
    floorMin: 5,
    floorMax: 6,
    spawnWeight: 0.5,
  },
  blight_spawn: {
    id: 'blight_spawn',
    name: 'Blight Spawn',
    displayName: '疫病の落とし子',
    baseStats: {
      hp: 14,
      maxHp: 14,
      attack: 4,
      defense: 2,
    },
    detectionRange: 5,
    moveSpeed: 1,
    regions: ['rotmyrkr'],
    floorMin: 3,
    floorMax: 4,
    spawnWeight: 1.0,
  },
  void_worm: {
    id: 'void_worm',
    name: 'Void Worm',
    displayName: '虚空蟲',
    baseStats: {
      hp: 25,
      maxHp: 25,
      attack: 10,
      defense: 2,
    },
    detectionRange: 6,
    moveSpeed: 1,
    regions: ['upphafsdjup'],
    floorMin: 7,
    floorMax: 8,
    spawnWeight: 0.6,
  },
};

export const createEnemyStats = (typeId: EnemyTypeId): CombatStats => {
  const definition = ENEMY_TYPES[typeId];
  return { ...definition.baseStats };
};

export const getEnemiesForFloor = (floor: number, region: EnemyRegion): EnemyTypeId[] => {
  return Object.values(ENEMY_TYPES)
    .filter(
      (enemy) =>
        enemy.regions.includes(region) &&
        floor >= enemy.floorMin &&
        floor <= enemy.floorMax
    )
    .map((enemy) => enemy.id);
};

export const selectRandomEnemy = (
  floor: number,
  region: EnemyRegion,
  rng: () => number
): EnemyTypeId => {
  const eligible = Object.values(ENEMY_TYPES).filter(
    (enemy) =>
      enemy.regions.includes(region) &&
      floor >= enemy.floorMin &&
      floor <= enemy.floorMax
  );

  if (eligible.length === 0) {
    return 'skeleton';
  }

  const totalWeight = eligible.reduce((sum, e) => sum + e.spawnWeight, 0);
  let roll = rng() * totalWeight;

  for (const enemy of eligible) {
    roll -= enemy.spawnWeight;
    if (roll <= 0) {
      return enemy.id;
    }
  }

  return eligible[0].id;
};

export interface BossTypeDefinition {
  id: BossTypeId;
  name: string;
  displayName: string;
  description: string;
  region: EnemyRegion;
  floor: number;
  phases: number;
  baseStats: CombatStats;
  phaseStats: CombatStats[];
  detectionRange: number;
}

export const BOSS_TYPES: Record<BossTypeId, BossTypeDefinition> = {
  hrodrvardr: {
    id: 'hrodrvardr',
    name: 'Hróðrvarðr',
    displayName: '栄誉の守護者',
    description: '神殿の守護者。歪んだ天使的存在。',
    region: 'hrodrgraf',
    floor: 2,
    phases: 2,
    baseStats: {
      hp: 80,
      maxHp: 80,
      attack: 8,
      defense: 4,
    },
    phaseStats: [
      { hp: 80, maxHp: 80, attack: 8, defense: 4 },
      { hp: 60, maxHp: 60, attack: 12, defense: 2 },
    ],
    detectionRange: 8,
  },
  rotgroftr: {
    id: 'rotgroftr',
    name: 'Rótgröftr',
    displayName: '根を蝕む者',
    description: '世界樹を蝕む巨大な寄生者。',
    region: 'rotmyrkr',
    floor: 4,
    phases: 2,
    baseStats: {
      hp: 120,
      maxHp: 120,
      attack: 10,
      defense: 6,
    },
    phaseStats: [
      { hp: 120, maxHp: 120, attack: 10, defense: 6 },
      { hp: 80, maxHp: 80, attack: 14, defense: 3 },
    ],
    detectionRange: 6,
  },
  gleymdkonungr: {
    id: 'gleymdkonungr',
    name: 'Gleymdkonungr',
    displayName: '忘れられし王',
    description: 'かつての王。今は何かの器となっている。',
    region: 'gleymdariki',
    floor: 6,
    phases: 3,
    baseStats: {
      hp: 150,
      maxHp: 150,
      attack: 12,
      defense: 5,
    },
    phaseStats: [
      { hp: 150, maxHp: 150, attack: 12, defense: 5 },
      { hp: 100, maxHp: 100, attack: 15, defense: 4 },
      { hp: 60, maxHp: 60, attack: 20, defense: 2 },
    ],
    detectionRange: 10,
  },
  oerslbarn: {
    id: 'oerslbarn',
    name: 'Œrslbarn',
    displayName: '始原の子',
    description: '形なき存在。最初の被造物。',
    region: 'upphafsdjup',
    floor: 8,
    phases: 3,
    baseStats: {
      hp: 200,
      maxHp: 200,
      attack: 15,
      defense: 8,
    },
    phaseStats: [
      { hp: 200, maxHp: 200, attack: 15, defense: 8 },
      { hp: 150, maxHp: 150, attack: 18, defense: 6 },
      { hp: 100, maxHp: 100, attack: 25, defense: 3 },
    ],
    detectionRange: 12,
  },
};

export const getBossForFloor = (floor: number, region: EnemyRegion): BossTypeId | null => {
  const boss = Object.values(BOSS_TYPES).find(
    (b) => b.region === region && b.floor === floor
  );
  return boss?.id ?? null;
};

export const createBossStats = (typeId: BossTypeId, phase = 0): CombatStats => {
  const definition = BOSS_TYPES[typeId];
  const stats = definition.phaseStats[phase] ?? definition.baseStats;
  return { ...stats };
};
