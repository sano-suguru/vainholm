import type { StatusEffectId } from '../combat/types';

// =============================================================================
// Item Categories
// =============================================================================

export type ItemCategory = 'consumable' | 'weapon' | 'equipment' | 'key' | 'relic';

export type ConsumableType =
  | 'healing_potion'
  | 'antidote'
  | 'scroll_identify'
  | 'scroll_teleport'
  | 'food_ration'
  | 'bomb';

export type ItemId = string;

// =============================================================================
// Item Definitions
// =============================================================================

export interface BaseItem {
  id: ItemId;
  category: ItemCategory;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  stackable: boolean;
  maxStack: number;
  identified: boolean;
  rarity: ItemRarity;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface ConsumableItem extends BaseItem {
  category: 'consumable';
  consumableType: ConsumableType;
  effect: ConsumableEffect;
  charges: number;
}

export type ConsumableEffect =
  | { type: 'heal'; amount: number }
  | { type: 'heal_percent'; percent: number }
  | { type: 'cure_status'; status: StatusEffectId | 'all' }
  | { type: 'reveal_map'; radius: number }
  | { type: 'teleport'; random: boolean }
  | { type: 'identify'; range: 'single' | 'all' }
  | { type: 'damage_aoe'; radius: number; damage: number };

export interface KeyItem extends BaseItem {
  category: 'key';
  keyType: 'door_key' | 'boss_key' | 'special';
  unlocks: string;
}

export interface RelicItem extends BaseItem {
  category: 'relic';
  passiveEffect: RelicEffect;
}

export type RelicEffect =
  | { type: 'stat_bonus'; stat: 'hp' | 'attack' | 'defense'; value: number }
  | { type: 'vision_bonus'; value: number }
  | { type: 'resistance'; element: 'fire' | 'ice' | 'poison'; percent: number };

export type Item = ConsumableItem | KeyItem | RelicItem;

// =============================================================================
// Inventory
// =============================================================================

export const INVENTORY_SIZE = 8;

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

export interface Inventory {
  slots: InventorySlot[];
  maxSlots: number;
}

// =============================================================================
// Item Stack
// =============================================================================

export interface ItemStack {
  itemId: ItemId;
  quantity: number;
}

// =============================================================================
// Item Drop
// =============================================================================

export interface ItemDrop {
  itemId: ItemId;
  position: { x: number; y: number };
  quantity: number;
}
