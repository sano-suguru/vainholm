import type { RelicDefinition } from '../stores/metaProgressionStore';

export type RelicId =
  | 'decayed_crown'
  | 'seers_eye'
  | 'warriors_band'
  | 'hunters_charm'
  | 'scholars_tome';

export const RELIC_DEFINITIONS: Record<RelicId, RelicDefinition> = {
  decayed_crown: {
    id: 'decayed_crown',
    name: 'Decayed Crown',
    displayName: '朽ちた王冠',
    description: '最大HP+10。かつての王の威光が宿る。',
    effect: { type: 'max_hp_bonus', amount: 10 },
  },
  seers_eye: {
    id: 'seers_eye',
    name: "Seer's Eye",
    displayName: '予見者の眼',
    description: '視界+1。闇の中でも先を見通す。',
    effect: { type: 'vision_bonus', amount: 1 },
  },
  warriors_band: {
    id: 'warriors_band',
    name: "Warrior's Band",
    displayName: '戦士の腕輪',
    description: '最大HP+5。戦場で鍛えられた証。',
    effect: { type: 'max_hp_bonus', amount: 5 },
  },
  hunters_charm: {
    id: 'hunters_charm',
    name: "Hunter's Charm",
    displayName: '狩人の護符',
    description: '環境からの毒ダメージを半減。森の狩人から受け継いだお守り。',
    effect: { type: 'resistance', element: 'poison' },
  },
  scholars_tome: {
    id: 'scholars_tome',
    name: "Scholar's Tome",
    displayName: '学者の書',
    description: '環境からの炎ダメージを半減。古代の知識が守りとなる。',
    effect: { type: 'resistance', element: 'fire' },
  },
};

export const RELIC_IDS: RelicId[] = [
  'decayed_crown',
  'seers_eye',
  'warriors_band',
  'hunters_charm',
  'scholars_tome',
];

export const getRelicById = (id: string): RelicDefinition | null => {
  return RELIC_DEFINITIONS[id as RelicId] ?? null;
};

export const isValidRelicId = (id: string): id is RelicId => {
  return id in RELIC_DEFINITIONS;
};
