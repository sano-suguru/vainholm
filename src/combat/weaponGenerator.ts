import type { Weapon, WeaponTypeId, WeaponTier, WeaponPremiumId } from './types';
import { WEAPON_TYPE_IDS } from './weapons';

const PREMIUM_IDS: WeaponPremiumId[] = [
  'hp_bonus',
  'attack_percent',
  'critical_chance',
  'life_steal',
  'poison_on_hit',
  'bleed_on_hit',
  'burn_on_hit',
  'stun_on_hit',
  'fire_damage',
  'undead_slayer',
];

const TIER_CONFIG: Record<WeaponTier, { premiumCount: [number, number]; attackBonus: [number, number]; weight: number }> = {
  common: { premiumCount: [0, 1], attackBonus: [0, 2], weight: 70 },
  rare: { premiumCount: [1, 2], attackBonus: [2, 4], weight: 25 },
  legendary: { premiumCount: [2, 3], attackBonus: [4, 6], weight: 5 },
};

const TIER_NAMES: Record<WeaponTier, Record<WeaponTypeId, string>> = {
  common: {
    sword: '錆びた剣',
    axe: '朽ちた斧',
    spear: '古い槍',
    dagger: '鈍い短剣',
    mace: '木の棍棒',
  },
  rare: {
    sword: '鋼の剣',
    axe: '戦斧',
    spear: '穂先の槍',
    dagger: '暗殺者の短剣',
    mace: '鉄の棍棒',
  },
  legendary: {
    sword: '英雄の剣',
    axe: '巨人殺しの斧',
    spear: '竜殺しの槍',
    dagger: '影の短剣',
    mace: '裁きの棍棒',
  },
};

let weaponIdCounter = 0;

const randomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const selectTier = (): WeaponTier => {
  const roll = Math.random() * 100;
  if (roll < TIER_CONFIG.legendary.weight) return 'legendary';
  if (roll < TIER_CONFIG.legendary.weight + TIER_CONFIG.rare.weight) return 'rare';
  return 'common';
};

const selectPremiums = (count: number): WeaponPremiumId[] => {
  if (count === 0) return [];
  
  const available = [...PREMIUM_IDS];
  const selected: WeaponPremiumId[] = [];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    selected.push(available[idx]);
    available.splice(idx, 1);
  }
  
  return selected;
};

export const createRandomWeapon = (floorDepth: number = 1): Weapon => {
  const tier = selectTier();
  const config = TIER_CONFIG[tier];
  
  const typeId = WEAPON_TYPE_IDS[Math.floor(Math.random() * WEAPON_TYPE_IDS.length)];
  
  const premiumCount = randomInt(config.premiumCount[0], config.premiumCount[1]);
  const premiums = selectPremiums(premiumCount);
  
  const baseBonus = randomInt(config.attackBonus[0], config.attackBonus[1]);
  const depthBonus = Math.floor(floorDepth / 2);
  const attackBonus = baseBonus + depthBonus;
  
  const name = TIER_NAMES[tier][typeId];
  
  weaponIdCounter++;
  
  return {
    id: `weapon_${weaponIdCounter}_${Date.now()}`,
    typeId,
    tier,
    name,
    attackBonus,
    premiums,
  };
};

export const WEAPON_DROP_CHANCE = 0.15;

export const shouldDropWeapon = (): boolean => 
  Math.random() < WEAPON_DROP_CHANCE;
