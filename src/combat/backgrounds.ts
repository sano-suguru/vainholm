import type { Background, BackgroundId } from './types';

export const BACKGROUNDS: Record<BackgroundId, Background> = {
  fallen_noble: {
    id: 'fallen_noble',
    name: 'Fallen Noble',
    displayName: '没落貴族',
    description: '初期アイテム+1。かつての栄光の名残。',
    effect: {
      type: 'extra_starting_item',
      count: 1,
    },
  },
  orphan: {
    id: 'orphan',
    name: 'Orphan',
    displayName: '孤児',
    description: '罠ダメージ半減。路地裏で生き延びた経験。',
    effect: {
      type: 'trap_damage_reduction',
      multiplier: 0.5,
    },
  },
  ex_soldier: {
    id: 'ex_soldier',
    name: 'Ex-Soldier',
    displayName: '元兵士',
    description: '初期HP+10。戦場で鍛えた肉体。',
    effect: {
      type: 'bonus_hp',
      amount: 10,
    },
  },
  herbalist_apprentice: {
    id: 'herbalist_apprentice',
    name: 'Herbalist Apprentice',
    displayName: '薬師の弟子',
    description: '回復アイテム効果+50%。薬草の知識。',
    effect: {
      type: 'healing_bonus',
      multiplier: 1.5,
    },
  },
  thief_child: {
    id: 'thief_child',
    name: 'Thief Child',
    displayName: '盗賊の子',
    description: 'ステルス攻撃ダメージ+1。闇に紛れる術。',
    effect: {
      type: 'stealth_damage_bonus',
      amount: 1,
    },
  },
  temple_raised: {
    id: 'temple_raised',
    name: 'Temple Raised',
    displayName: '神殿育ち',
    description: '残滓取引の代償軽減。神々との繋がり。',
    effect: {
      type: 'remnant_cost_reduction',
      multiplier: 0.7,
    },
  },
};

export const getBackground = (id: BackgroundId): Background => BACKGROUNDS[id];

export const BACKGROUND_IDS: BackgroundId[] = [
  'fallen_noble',
  'orphan',
  'ex_soldier',
  'herbalist_apprentice',
  'thief_child',
  'temple_raised',
];
