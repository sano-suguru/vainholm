import type { RelicDefinition, RelicEffect } from '../stores/metaProgressionStore';

export const RELICS: Record<string, RelicDefinition> = {
  one_eyed_shard: {
    id: 'one_eyed_shard',
    name: 'Shard of the One-Eyed',
    displayName: '隻眼の欠片',
    description: '暗闇での視界+1。片目を失った神の力の残滓。',
    effect: { type: 'vision_bonus', amount: 1 },
  },
  decayed_crown: {
    id: 'decayed_crown',
    name: 'Decayed Crown',
    displayName: '朽ちた王冠',
    description: '最大HP+5。忘却の王国の遺物。',
    effect: { type: 'max_hp_bonus', amount: 5 },
  },
  frozen_heart: {
    id: 'frozen_heart',
    name: 'Frozen Heart',
    displayName: '凍てついた心臓',
    description: '冷気耐性。氷の巨人の心臓の欠片。',
    effect: { type: 'resistance', element: 'ice' },
  },
  ember_stone: {
    id: 'ember_stone',
    name: 'Ember Stone',
    displayName: '残り火の石',
    description: '火炎耐性。ムスペルの炎を宿す石。',
    effect: { type: 'resistance', element: 'fire' },
  },
  serpent_scale: {
    id: 'serpent_scale',
    name: 'Serpent Scale',
    displayName: '世界蛇の鱗',
    description: '毒耐性。ヨルムンガンドの鱗。',
    effect: { type: 'resistance', element: 'poison' },
  },
  warriors_memento: {
    id: 'warriors_memento',
    name: 'Warrior\'s Memento',
    displayName: '戦士の形見',
    description: '最大HP+10。エインヘリャルの遺品。',
    effect: { type: 'max_hp_bonus', amount: 10 },
  },
  seers_eye: {
    id: 'seers_eye',
    name: 'Seer\'s Eye',
    displayName: '予見者の眼',
    description: '視界+2。ヴェルヴァの目玉。',
    effect: { type: 'vision_bonus', amount: 2 },
  },
  root_fragment: {
    id: 'root_fragment',
    name: 'Fragment of the World Tree',
    displayName: '世界樹の欠片',
    description: '最大HP+3、視界+1。ユグドラシルの根。',
    effect: { type: 'max_hp_bonus', amount: 3 },
  },
};

export const RELIC_IDS = Object.keys(RELICS);

export const getRelic = (id: string): RelicDefinition | null => RELICS[id] ?? null;

export const applyRelicEffect = (
  effect: RelicEffect,
  stats: { maxHp: number; visionRadius: number }
): { maxHp: number; visionRadius: number } => {
  switch (effect.type) {
    case 'max_hp_bonus':
      return { ...stats, maxHp: stats.maxHp + effect.amount };
    case 'vision_bonus':
      return { ...stats, visionRadius: stats.visionRadius + effect.amount };
    case 'resistance':
    case 'starting_item':
      return stats;
    default: {
      const _exhaustiveCheck: never = effect;
      return _exhaustiveCheck;
    }
  }
};
