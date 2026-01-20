import type { GlowColor } from './colors';

export interface TierConfig {
  premiumCount: [number, number];
  passivePremiumCount: [number, number];
  bonusRange: [number, number];
  weight: number;
}

export type EquipmentTier = 'common' | 'rare' | 'legendary';

export const selectTier = <T extends string>(
  tierConfig: Record<T, TierConfig>
): T => {
  const roll = Math.random() * 100;
  const tiers = Object.entries(tierConfig) as [T, TierConfig][];
  
  tiers.sort((a, b) => a[1].weight - b[1].weight);
  
  let cumulative = 0;
  for (const [tier, config] of tiers) {
    cumulative += config.weight;
    if (roll < cumulative) return tier;
  }
  
  return tiers[tiers.length - 1][0];
};

export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

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

export interface GlowableEquipment {
  premiums: readonly unknown[];
  passivePremiums: readonly unknown[];
  isUnique?: boolean;
}

export const getEquipmentGlowColor = (equipment: GlowableEquipment): GlowColor => {
  if (equipment.isUnique) return 'gold';

  const hasBluePremium = equipment.premiums.length > 0;
  const hasGreenPremium = equipment.passivePremiums.length > 0;

  if (hasBluePremium && hasGreenPremium) return 'cyan';
  if (hasGreenPremium) return 'green';
  if (hasBluePremium) return 'blue';
  return 'white';
};

let equipmentIdCounter = 0;

export const generateEquipmentId = (prefix: string): string => {
  equipmentIdCounter++;
  return `${prefix}_${equipmentIdCounter}_${Date.now()}`;
};

export const resetEquipmentIdCounter = (): void => {
  equipmentIdCounter = 0;
};
