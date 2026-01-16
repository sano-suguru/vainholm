import type {
  WeaponPattern,
  WeaponTypeId,
  WeaponPremium,
  WeaponPremiumId,
  StatusEffectDefinition,
  StatusEffectId,
} from './types';

export const WEAPON_PATTERNS: Record<WeaponTypeId, WeaponPattern> = {
  sword: {
    id: 'sword',
    name: 'Sword',
    displayName: '剣',
    attackType: { type: 'standard' },
  },
  axe: {
    id: 'axe',
    name: 'Axe',
    displayName: '斧',
    attackType: { type: 'cleave', directions: 8 },
  },
  spear: {
    id: 'spear',
    name: 'Spear',
    displayName: '槍',
    attackType: { type: 'pierce', range: 2 },
  },
  dagger: {
    id: 'dagger',
    name: 'Dagger',
    displayName: '短剣',
    attackType: { type: 'stealth_bonus', multiplier: 2.0 },
  },
  mace: {
    id: 'mace',
    name: 'Mace',
    displayName: '棍棒',
    attackType: { type: 'knockback', distance: 1 },
  },
};

export const WEAPON_PREMIUMS: Record<WeaponPremiumId, WeaponPremium> = {
  hp_bonus: {
    id: 'hp_bonus',
    name: 'Vitality',
    displayName: '活力',
    effect: { type: 'stat_bonus', stat: 'hp', value: 10, isPercent: false },
  },
  attack_percent: {
    id: 'attack_percent',
    name: 'Power',
    displayName: '力',
    effect: { type: 'stat_bonus', stat: 'attack', value: 20, isPercent: true },
  },
  critical_chance: {
    id: 'critical_chance',
    name: 'Precision',
    displayName: '精密',
    effect: { type: 'critical_bonus', chance: 0.15 },
  },
  life_steal: {
    id: 'life_steal',
    name: 'Vampiric',
    displayName: '吸血',
    effect: { type: 'life_steal', percent: 0.1 },
  },
  poison_on_hit: {
    id: 'poison_on_hit',
    name: 'Venomous',
    displayName: '猛毒',
    effect: { type: 'status_on_hit', status: 'poison', duration: 3, chance: 0.25 },
  },
  bleed_on_hit: {
    id: 'bleed_on_hit',
    name: 'Serrated',
    displayName: '鋸刃',
    effect: { type: 'status_on_hit', status: 'bleed', duration: 3, chance: 0.25 },
  },
  burn_on_hit: {
    id: 'burn_on_hit',
    name: 'Blazing',
    displayName: '炎熱',
    effect: { type: 'status_on_hit', status: 'burn', duration: 2, chance: 0.2 },
  },
  stun_on_hit: {
    id: 'stun_on_hit',
    name: 'Stunning',
    displayName: '衝撃',
    effect: { type: 'status_on_hit', status: 'stun', duration: 1, chance: 0.1 },
  },
  fire_damage: {
    id: 'fire_damage',
    name: 'Flaming',
    displayName: '火炎',
    effect: { type: 'elemental_damage', element: 'fire', damage: 3 },
  },
  undead_slayer: {
    id: 'undead_slayer',
    name: 'Holy',
    displayName: '聖別',
    effect: { type: 'slayer', enemyType: 'undead', damageMultiplier: 1.5 },
  },
};

export const STATUS_EFFECTS: Record<StatusEffectId, StatusEffectDefinition> = {
  poison: {
    id: 'poison',
    name: 'Poison',
    displayName: '毒',
    description: '毎ターンダメージを受ける。',
    stackable: true,
    maxStacks: 5,
    effect: { type: 'damage_over_time', damagePerTurn: 2 },
  },
  bleed: {
    id: 'bleed',
    name: 'Bleed',
    displayName: '出血',
    description: '毎ターンダメージを受ける。移動するとさらに悪化。',
    stackable: true,
    maxStacks: 5,
    effect: { type: 'damage_over_time', damagePerTurn: 3 },
  },
  burn: {
    id: 'burn',
    name: 'Burn',
    displayName: '炎上',
    description: '毎ターン大ダメージを受ける。',
    stackable: false,
    maxStacks: 1,
    effect: { type: 'damage_over_time', damagePerTurn: 5 },
  },
  stun: {
    id: 'stun',
    name: 'Stun',
    displayName: 'スタン',
    description: 'ターンをスキップする。',
    stackable: false,
    maxStacks: 1,
    effect: { type: 'skip_turn' },
  },
  slow: {
    id: 'slow',
    name: 'Slow',
    displayName: '鈍足',
    description: '移動速度が低下する。',
    stackable: false,
    maxStacks: 1,
    effect: { type: 'slow', movementPenalty: 1 },
  },
  blind: {
    id: 'blind',
    name: 'Blind',
    displayName: '盲目',
    description: '視界が狭まる。',
    stackable: false,
    maxStacks: 1,
    effect: { type: 'vision_reduction', radiusReduction: 4 },
  },
};

export const getWeaponPattern = (id: WeaponTypeId): WeaponPattern => WEAPON_PATTERNS[id];
export const getWeaponPremium = (id: WeaponPremiumId): WeaponPremium => WEAPON_PREMIUMS[id];
export const getStatusEffect = (id: StatusEffectId): StatusEffectDefinition => STATUS_EFFECTS[id];

export const WEAPON_TYPE_IDS: WeaponTypeId[] = ['sword', 'axe', 'spear', 'dagger', 'mace'];
