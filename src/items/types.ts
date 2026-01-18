import type { StatusEffectId, Weapon, Armor } from '../combat/types';

// =============================================================================
// Item Categories
// =============================================================================

export type ItemCategory = 'consumable' | 'weapon' | 'equipment' | 'key' | 'relic';

export type ConsumableType =
  | 'healing_potion'
  | 'antidote'
  | 'scroll_identify'
  | 'scroll_teleport'
  | 'scroll_enchant'
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
  | { type: 'damage_aoe'; radius: number; damage: number }
  | { type: 'enchant'; target: 'weapon' | 'armor' };

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

export type InventoryItem = Item | Weapon | Armor;

export const isWeapon = (item: InventoryItem): item is Weapon => 
  'typeId' in item && 'attackBonus' in item;

export const isArmor = (item: InventoryItem): item is Armor =>
  'slot' in item && 'defenseBonus' in item && !('typeId' in item);

export const isConsumable = (item: InventoryItem): item is ConsumableItem =>
  'category' in item && item.category === 'consumable';

// =============================================================================
// Inventory
// =============================================================================

export const INVENTORY_SIZE = 8;

export interface InventorySlot {
  item: InventoryItem | null;
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
