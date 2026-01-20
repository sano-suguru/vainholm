import type {
  ArmorSlot,
  ArmorTier,
  ArmorPremium,
  ArmorPremiumId,
  Armor,
} from './types';
import type { GlowColor } from './colors';
import { GLOW_COLORS } from './colors';
import { PASSIVE_PREMIUM_IDS } from './weapons';
import {
  selectRandomUnique,
  randomInt,
  generateEquipmentId,
  getEquipmentGlowColor,
} from './equipmentGenerator';

export const ARMOR_PREMIUMS: Record<ArmorPremiumId, ArmorPremium> = {
  physical_resist: {
    id: 'physical_resist',
    name: 'Fortified',
    displayName: '堅牢',
    effect: { type: 'damage_reduction', percent: 15 },
  },
  fire_resist: {
    id: 'fire_resist',
    name: 'Fireproof',
    displayName: '耐火',
    effect: { type: 'elemental_resist', element: 'fire', percent: 30 },
  },
  ice_resist: {
    id: 'ice_resist',
    name: 'Frostproof',
    displayName: '耐冷',
    effect: { type: 'elemental_resist', element: 'ice', percent: 30 },
  },
  lightning_resist: {
    id: 'lightning_resist',
    name: 'Insulated',
    displayName: '耐電',
    effect: { type: 'elemental_resist', element: 'lightning', percent: 30 },
  },
  reflect: {
    id: 'reflect',
    name: 'Reflective',
    displayName: '反射',
    effect: { type: 'reflect_damage', percent: 10 },
  },
  thorns: {
    id: 'thorns',
    name: 'Thorny',
    displayName: '棘',
    effect: { type: 'thorns_damage', flatDamage: 3 },
  },
};

export const getArmorPremium = (id: ArmorPremiumId): ArmorPremium => ARMOR_PREMIUMS[id];

export const ARMOR_PREMIUM_IDS: ArmorPremiumId[] = [
  'physical_resist',
  'fire_resist',
  'ice_resist',
  'lightning_resist',
  'reflect',
  'thorns',
];

export const ENCHANTABLE_ARMOR_PREMIUM_IDS: readonly ArmorPremiumId[] = [
  'physical_resist',
  'fire_resist',
  'ice_resist',
  'lightning_resist',
  'reflect',
  'thorns',
] as const;

const TIER_CONFIG: Record<ArmorTier, { 
  premiumCount: [number, number]; 
  passivePremiumCount: [number, number];
  defenseBonus: [number, number]; 
  weight: number;
}> = {
  common: { premiumCount: [0, 1], passivePremiumCount: [0, 0], defenseBonus: [1, 3], weight: 70 },
  rare: { premiumCount: [1, 2], passivePremiumCount: [0, 1], defenseBonus: [3, 5], weight: 25 },
  legendary: { premiumCount: [2, 3], passivePremiumCount: [0, 2], defenseBonus: [5, 8], weight: 5 },
};

const TIER_NAMES: Record<ArmorTier, string> = {
  common: '革の鎧',
  rare: '鎖帷子',
  legendary: '英雄の鎧',
};

const selectTier = (): ArmorTier => {
  const roll = Math.random() * 100;
  if (roll < TIER_CONFIG.legendary.weight) return 'legendary';
  if (roll < TIER_CONFIG.legendary.weight + TIER_CONFIG.rare.weight) return 'rare';
  return 'common';
};

export const createRandomArmor = (floorDepth: number = 1): Armor => {
  const tier = selectTier();
  const config = TIER_CONFIG[tier];
  const slot: ArmorSlot = 'body';

  const premiumCount = randomInt(config.premiumCount[0], config.premiumCount[1]);
  const premiums = selectRandomUnique(ARMOR_PREMIUM_IDS, premiumCount);

  const passivePremiumCount = randomInt(config.passivePremiumCount[0], config.passivePremiumCount[1]);
  const passivePremiums = selectRandomUnique(PASSIVE_PREMIUM_IDS, passivePremiumCount);

  const baseBonus = randomInt(config.defenseBonus[0], config.defenseBonus[1]);
  const depthBonus = Math.floor(floorDepth / 3);
  const defenseBonus = baseBonus + depthBonus;

  const name = TIER_NAMES[tier];

  return {
    id: generateEquipmentId('armor'),
    slot,
    tier,
    name,
    defenseBonus,
    premiums,
    passivePremiums,
  };
};

export const ARMOR_DROP_CHANCE = 0.08;

export const shouldDropArmor = (): boolean =>
  Math.random() < ARMOR_DROP_CHANCE;

export type ArmorGlowColor = GlowColor;
export const ARMOR_GLOW_COLORS = GLOW_COLORS;

export const getArmorGlowColor = getEquipmentGlowColor;
