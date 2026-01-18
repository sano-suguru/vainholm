import type {
  WeaponPattern,
  WeaponTypeId,
  WeaponPremium,
  WeaponPremiumId,
  PassivePremium,
  PassivePremiumId,
} from './types';
import type { GlowColor } from './colors';
import { GLOW_COLORS } from './colors';

export { getStatusEffect } from './statusEffects';

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
  ice_damage: {
    id: 'ice_damage',
    name: 'Freezing',
    displayName: '冷気',
    effect: { type: 'elemental_damage', element: 'ice', damage: 3 },
  },
  lightning_damage: {
    id: 'lightning_damage',
    name: 'Shocking',
    displayName: '雷撃',
    effect: { type: 'elemental_damage', element: 'lightning', damage: 4 },
  },
  attack_count: {
    id: 'attack_count',
    name: 'Multi-Strike',
    displayName: 'かず+1',
    effect: { type: 'attack_count', extraAttacks: 1 },
  },
  pierce: {
    id: 'pierce',
    name: 'Piercing',
    displayName: '貫通',
    effect: { type: 'pierce_enemies' },
  },
  knockback: {
    id: 'knockback',
    name: 'Forceful',
    displayName: '吹飛',
    effect: { type: 'knockback_on_hit', distance: 1 },
  },
};

export const PASSIVE_PREMIUMS: Record<PassivePremiumId, PassivePremium> = {
  max_hp_percent: {
    id: 'max_hp_percent',
    name: 'Vigor',
    displayName: '生命',
    effect: { type: 'max_hp_percent', percent: 20 },
  },
  vision_bonus: {
    id: 'vision_bonus',
    name: 'Far Sight',
    displayName: '遠視',
    effect: { type: 'vision_bonus', radius: 1 },
  },
  trap_sense: {
    id: 'trap_sense',
    name: 'Trap Sense',
    displayName: '罠感知',
    effect: { type: 'trap_detection', radius: 3 },
  },
  stealth: {
    id: 'stealth',
    name: 'Stealth',
    displayName: '忍び足',
    effect: { type: 'stealth_bonus', detectionReduction: 2 },
  },
  poison_resist: {
    id: 'poison_resist',
    name: 'Poison Ward',
    displayName: '毒耐性',
    effect: { type: 'resistance', resistType: 'poison', percent: 50 },
  },
  fire_resist: {
    id: 'fire_resist',
    name: 'Fire Ward',
    displayName: '炎耐性',
    effect: { type: 'resistance', resistType: 'fire', percent: 50 },
  },
};


export const getWeaponPattern = (id: WeaponTypeId): WeaponPattern => WEAPON_PATTERNS[id];
export const getWeaponPremium = (id: WeaponPremiumId): WeaponPremium => WEAPON_PREMIUMS[id];
export const getPassivePremium = (id: PassivePremiumId): PassivePremium => PASSIVE_PREMIUMS[id];

export const WEAPON_TYPE_IDS: WeaponTypeId[] = ['sword', 'axe', 'spear', 'dagger', 'mace'];
export const PASSIVE_PREMIUM_IDS: PassivePremiumId[] = [
  'max_hp_percent',
  'vision_bonus', 
  'trap_sense',
  'stealth',
  'poison_resist',
  'fire_resist',
];

export const selectRandomUnique = <T>(pool: readonly T[], count: number): T[] => {
  if (count === 0) return [];
  
  const available = [...pool];
  const selected: T[] = [];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    selected.push(available[idx]);
    available.splice(idx, 1);
  }
  
  return selected;
};

export type WeaponGlowColor = GlowColor;
export const WEAPON_GLOW_COLORS = GLOW_COLORS;

export const getWeaponGlowColor = (weapon: {
  premiums: readonly unknown[];
  passivePremiums: readonly unknown[];
  isUnique?: boolean;
}): WeaponGlowColor => {
  if (weapon.isUnique) return 'gold';
  
  const hasBluePremium = weapon.premiums.length > 0;
  const hasGreenPremium = weapon.passivePremiums.length > 0;
  
  if (hasBluePremium && hasGreenPremium) return 'cyan';
  if (hasGreenPremium) return 'green';
  if (hasBluePremium) return 'blue';
  return 'white';
};
