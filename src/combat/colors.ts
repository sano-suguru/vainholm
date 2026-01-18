export type GlowColor = 'white' | 'blue' | 'green' | 'cyan' | 'gold';

export const GLOW_COLORS: Record<GlowColor, string> = {
  white: '#e0e0e0',
  blue: '#4a9aff',
  green: '#4aff4a',
  cyan: '#4affff',
  gold: '#ffd700',
};

export type EquipmentTier = 'common' | 'rare' | 'legendary';

export const TIER_COLORS: Record<EquipmentTier, string> = {
  common: '#8a7a6a',
  rare: '#4a7a9a',
  legendary: '#c9a227',
};
