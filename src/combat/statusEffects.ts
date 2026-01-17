import type { StatusEffectDefinition, StatusEffectId } from './types';

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
    description: '敵の行動回数が増える。',
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
  invulnerable: {
    id: 'invulnerable',
    name: 'Invulnerable',
    displayName: '無敵',
    description: '一時的にダメージを受けない。',
    stackable: false,
    maxStacks: 1,
    effect: { type: 'invulnerability' },
  },
};

export const getStatusEffect = (id: StatusEffectId): StatusEffectDefinition => STATUS_EFFECTS[id];
