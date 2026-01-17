import type { ConsumableItem, ConsumableType, ItemRarity } from './types';

let itemIdCounter = 0;

const generateItemId = (): string => {
  itemIdCounter += 1;
  return `item_${itemIdCounter}`;
};

interface ConsumableDefinition {
  consumableType: ConsumableType;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  rarity: ItemRarity;
  effect: ConsumableItem['effect'];
  stackable: boolean;
  maxStack: number;
}

const CONSUMABLE_DEFINITIONS: Record<ConsumableType, ConsumableDefinition> = {
  healing_potion: {
    consumableType: 'healing_potion',
    nameKey: '回復薬',
    descriptionKey: 'HPを15回復する',
    icon: 'potion_red',
    rarity: 'common',
    effect: { type: 'heal', amount: 15 },
    stackable: true,
    maxStack: 5,
  },
  antidote: {
    consumableType: 'antidote',
    nameKey: '解毒剤',
    descriptionKey: '毒状態を治療する',
    icon: 'potion_green',
    rarity: 'uncommon',
    effect: { type: 'cure_status', status: 'poison' },
    stackable: true,
    maxStack: 3,
  },
  scroll_identify: {
    consumableType: 'scroll_identify',
    nameKey: '鑑定の巻物',
    descriptionKey: 'アイテムを1つ鑑定する',
    icon: 'scroll',
    rarity: 'uncommon',
    effect: { type: 'identify', range: 'single' },
    stackable: true,
    maxStack: 3,
  },
  scroll_teleport: {
    consumableType: 'scroll_teleport',
    nameKey: '転移の巻物',
    descriptionKey: 'ランダムな場所に転移する',
    icon: 'scroll_blue',
    rarity: 'rare',
    effect: { type: 'teleport', random: true },
    stackable: true,
    maxStack: 2,
  },
  food_ration: {
    consumableType: 'food_ration',
    nameKey: '携帯食',
    descriptionKey: 'HPを5回復する',
    icon: 'food',
    rarity: 'common',
    effect: { type: 'heal', amount: 5 },
    stackable: true,
    maxStack: 10,
  },
  bomb: {
    consumableType: 'bomb',
    nameKey: '爆弾',
    descriptionKey: '周囲にダメージを与える',
    icon: 'bomb',
    rarity: 'uncommon',
    effect: { type: 'damage_aoe', radius: 2, damage: 20 },
    stackable: true,
    maxStack: 3,
  },
};

export const createConsumable = (
  consumableType: ConsumableType,
  identified = true
): ConsumableItem => {
  const def = CONSUMABLE_DEFINITIONS[consumableType];
  return {
    id: generateItemId(),
    category: 'consumable',
    consumableType: def.consumableType,
    nameKey: def.nameKey,
    descriptionKey: def.descriptionKey,
    icon: def.icon,
    rarity: def.rarity,
    effect: def.effect,
    stackable: def.stackable,
    maxStack: def.maxStack,
    identified,
    charges: 1,
  };
};

export const getConsumableDefinition = (
  consumableType: ConsumableType
): ConsumableDefinition => CONSUMABLE_DEFINITIONS[consumableType];

export const CONSUMABLE_TYPES = Object.keys(CONSUMABLE_DEFINITIONS) as ConsumableType[];

export const IMPLEMENTED_CONSUMABLE_TYPES = CONSUMABLE_TYPES.filter((consumableType) => {
  const effect = CONSUMABLE_DEFINITIONS[consumableType].effect;
  return effect.type === 'heal' || effect.type === 'heal_percent' || effect.type === 'cure_status';
});
