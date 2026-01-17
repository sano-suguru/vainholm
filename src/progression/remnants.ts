export type RemnantId = 'eineygi' | 'halfvita' | 'bundinn' | 'ginandi';

export interface RemnantTrade {
  id: string;
  description: string;
  benefit: RemnantBenefit;
  cost: RemnantCost;
}

export type RemnantBenefit =
  | { type: 'reveal_next_region' }
  | { type: 'stat_buff'; stat: 'attack' | 'defense'; amount: number; duration: number }
  | { type: 'grant_relic'; relicId: string }
  | { type: 'full_heal' }
  | { type: 'reveal_traps' }
  | { type: 'temporary_invulnerability'; turns: number };

export type RemnantCost =
  | { type: 'vision_reduction'; amount: number; permanent: boolean }
  | { type: 'max_hp_reduction'; amount: number; permanent: boolean }
  | { type: 'movement_penalty'; turns: number }
  | { type: 'hp_damage'; amount: number }
  | { type: 'random_stat_loss'; amount: number };

export interface RemnantDefinition {
  id: RemnantId;
  name: string;
  displayName: string;
  oldNorse: string;
  description: string;
  region: 'hrodrgraf' | 'rotmyrkr' | 'gleymdariki' | 'upphafsdjup';
  trades: RemnantTrade[];
  dialogue: {
    greeting: string;
    accept: string;
    decline: string;
  };
}

export const REMNANTS: Record<RemnantId, RemnantDefinition> = {
  eineygi: {
    id: 'eineygi',
    name: 'The One-Eyed',
    displayName: '隻眼の者',
    oldNorse: 'Eineygi',
    description: '情報と先見の力を与える。代償として視界を奪う。',
    region: 'hrodrgraf',
    trades: [
      {
        id: 'eineygi_reveal_region',
        description: '次の領域のマップを全て見せる',
        benefit: { type: 'reveal_next_region' },
        cost: { type: 'vision_reduction', amount: 1, permanent: true },
      },
      {
        id: 'eineygi_reveal_traps',
        description: 'この階の全ての罠を可視化する',
        benefit: { type: 'reveal_traps' },
        cost: { type: 'vision_reduction', amount: 1, permanent: false },
      },
    ],
    dialogue: {
      greeting: 'この先に何があるか、見せてやろう。代わりに、お前の片目を寄越せ。',
      accept: '…よい取引だ。さあ、見るがいい。',
      decline: '愚かな。闇の中を彷徨うがいい。',
    },
  },
  halfvita: {
    id: 'halfvita',
    name: 'The Half-Wise',
    displayName: '半知の者',
    oldNorse: 'Hálfvita',
    description: '能力とバフを与える。代償として記憶を奪う。',
    region: 'rotmyrkr',
    trades: [
      {
        id: 'halfvita_attack_buff',
        description: '攻撃力+3（この階のみ）',
        benefit: { type: 'stat_buff', stat: 'attack', amount: 3, duration: -1 },
        cost: { type: 'random_stat_loss', amount: 1 },
      },
      {
        id: 'halfvita_defense_buff',
        description: '防御力+2（この階のみ）',
        benefit: { type: 'stat_buff', stat: 'defense', amount: 2, duration: -1 },
        cost: { type: 'max_hp_reduction', amount: 3, permanent: false },
      },
    ],
    dialogue: {
      greeting: '力が欲しいか？代わりに、お前の記憶を少しだけ頂こう。',
      accept: '…忘れるがいい。そして強くなれ。',
      decline: '自力で生き延びるつもりか。見上げた根性だ。',
    },
  },
  bundinn: {
    id: 'bundinn',
    name: 'The Bound One',
    displayName: '縛られた者',
    oldNorse: 'Bundinn',
    description: '遺物を与える。代償として自由を奪う。',
    region: 'gleymdariki',
    trades: [
      {
        id: 'bundinn_relic_crown',
        description: '「朽ちた王冠」を授ける',
        benefit: { type: 'grant_relic', relicId: 'decayed_crown' },
        cost: { type: 'movement_penalty', turns: 20 },
      },
      {
        id: 'bundinn_relic_eye',
        description: '「予見者の眼」を授ける',
        benefit: { type: 'grant_relic', relicId: 'seers_eye' },
        cost: { type: 'max_hp_reduction', amount: 5, permanent: true },
      },
    ],
    dialogue: {
      greeting: '我は縛られている。だが、お前を縛ることもできる。遺物が欲しければ、代償を払え。',
      accept: '…鎖は重い。だが、お前は手に入れた。',
      decline: '賢明かもしれぬ。自由は何よりも尊い。',
    },
  },
  ginandi: {
    id: 'ginandi',
    name: 'The Gaping One',
    displayName: '顎を開く者',
    oldNorse: 'Gínandi',
    description: '強力な効果を与えるが、代償も大きい。',
    region: 'upphafsdjup',
    trades: [
      {
        id: 'ginandi_full_heal',
        description: 'HPを完全回復する',
        benefit: { type: 'full_heal' },
        cost: { type: 'max_hp_reduction', amount: 10, permanent: true },
      },
      {
        id: 'ginandi_invulnerability',
        description: '10ターンの無敵状態',
        benefit: { type: 'temporary_invulnerability', turns: 10 },
        cost: { type: 'hp_damage', amount: 15 },
      },
    ],
    dialogue: {
      greeting: '我が口は全てを飲み込む。だが、与えることもできる。何が欲しい？',
      accept: '…美味であった。さあ、受け取れ。',
      decline: '臆病者め。だが、生きているだけで十分かもしれぬ。',
    },
  },
};

export const REMNANT_IDS: RemnantId[] = ['eineygi', 'halfvita', 'bundinn', 'ginandi'];

export const getRemnant = (id: RemnantId): RemnantDefinition => REMNANTS[id];

export const getRemnantForRegion = (
  region: 'hrodrgraf' | 'rotmyrkr' | 'gleymdariki' | 'upphafsdjup'
): RemnantDefinition | null => {
  const remnant = REMNANT_IDS.find((id) => REMNANTS[id].region === region);
  return remnant ? REMNANTS[remnant] : null;
};
