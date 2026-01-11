import type { TileType } from '../types';

export type OverlayId = 'flowers_1' | 'flowers_2' | 'pebbles_1' | 'pebbles_2' | 'leaves' | 'tall_grass';

interface OverlayRule {
  type: OverlayId;
  weight: number;
}

interface OverlayRuleSet {
  rules: OverlayRule[];
  totalWeight: number;
}

function createRuleSet(rules: OverlayRule[]): OverlayRuleSet {
  return {
    rules,
    totalWeight: rules.reduce((sum, r) => sum + r.weight, 0),
  };
}

const OVERLAY_RULES: Partial<Record<TileType, OverlayRuleSet>> = {
  grass: createRuleSet([
    { type: 'flowers_1', weight: 3 },
    { type: 'flowers_2', weight: 2 },
    { type: 'tall_grass', weight: 4 },
    { type: 'pebbles_1', weight: 1 },
  ]),
  flowers: createRuleSet([
    { type: 'flowers_1', weight: 4 },
    { type: 'flowers_2', weight: 4 },
    { type: 'tall_grass', weight: 2 },
  ]),
  withered_grass: createRuleSet([
    { type: 'leaves', weight: 6 },
    { type: 'pebbles_1', weight: 3 },
    { type: 'pebbles_2', weight: 2 },
  ]),
  forest: createRuleSet([
    { type: 'leaves', weight: 8 },
    { type: 'tall_grass', weight: 3 },
  ]),
  swamp: createRuleSet([
    { type: 'tall_grass', weight: 6 },
    { type: 'leaves', weight: 2 },
  ]),
  sand: createRuleSet([
    { type: 'pebbles_1', weight: 5 },
    { type: 'pebbles_2', weight: 5 },
  ]),
  hills: createRuleSet([
    { type: 'pebbles_1', weight: 4 },
    { type: 'pebbles_2', weight: 4 },
  ]),
};

const OVERLAY_SPAWN_CHANCE: Partial<Record<TileType, number>> = {
  grass: 0.08,
  flowers: 0.06,
  withered_grass: 0.10,
  forest: 0.12,
  swamp: 0.06,
  sand: 0.05,
  hills: 0.04,
};

export function selectOverlay(
  tileType: TileType,
  random: number,
): OverlayId | null {
  const ruleSet = OVERLAY_RULES[tileType];
  if (!ruleSet || ruleSet.rules.length === 0) return null;

  const threshold = random * ruleSet.totalWeight;

  let cumulative = 0;
  for (const rule of ruleSet.rules) {
    cumulative += rule.weight;
    if (threshold < cumulative) {
      return rule.type;
    }
  }

  return ruleSet.rules[ruleSet.rules.length - 1]?.type ?? null;
}

export function shouldSpawnOverlay(
  tileType: TileType,
  random: number,
): boolean {
  const chance = OVERLAY_SPAWN_CHANCE[tileType];
  return chance !== undefined && random < chance;
}
