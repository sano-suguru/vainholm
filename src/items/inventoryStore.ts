import { create } from 'zustand';

import type { Item, ItemId, InventorySlot, ConsumableItem, InventoryItem } from './types';
import { INVENTORY_SIZE, isWeapon, isArmor } from './types';
import { useGameStore } from '../stores/gameStore';

interface InventoryStore {
  slots: InventorySlot[];
  selectedSlot: number | null;

  addItem: (item: InventoryItem, quantity?: number) => boolean;
  removeItem: (slotIndex: number, quantity?: number) => InventoryItem | null;
  consumeItem: (slotIndex: number) => boolean;
  swapSlots: (fromIndex: number, toIndex: number) => void;
  selectSlot: (slotIndex: number | null) => void;
  getItemAt: (slotIndex: number) => InventoryItem | null;
  findItemById: (itemId: ItemId) => { slotIndex: number; item: InventoryItem } | null;
  hasItem: (itemId: ItemId) => boolean;
  getFreeSlotCount: () => number;
  clearInventory: () => void;
}

const createEmptySlots = (): InventorySlot[] =>
  Array.from({ length: INVENTORY_SIZE }, () => ({ item: null, quantity: 0 }));

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  slots: createEmptySlots(),
  selectedSlot: null,

  addItem: (item: InventoryItem, quantity = 1): boolean => {
    const { slots } = get();

    if (isWeapon(item) || isArmor(item)) {
      const emptySlotIndex = slots.findIndex((slot) => slot.item === null);
      if (emptySlotIndex === -1) return false;

      const newSlots = [...slots];
      newSlots[emptySlotIndex] = { item, quantity: 1 };
      set({ slots: newSlots });
      return true;
    }

    let remaining = quantity;
    const baseItem = item as Item;

    while (remaining > 0) {
      const currentSlots = get().slots;

      if (baseItem.stackable) {
        const existingSlotIndex = currentSlots.findIndex(
          (slot) =>
            slot.item !== null &&
            'category' in slot.item &&
            slot.item.category === baseItem.category &&
            'consumableType' in slot.item &&
            'consumableType' in baseItem &&
            slot.item.consumableType === baseItem.consumableType &&
            slot.quantity < baseItem.maxStack
        );

        if (existingSlotIndex !== -1) {
          const existingSlot = currentSlots[existingSlotIndex];
          const spaceAvailable = baseItem.maxStack - existingSlot.quantity;
          const toAdd = Math.min(remaining, spaceAvailable);

          const newSlots = [...currentSlots];
          newSlots[existingSlotIndex] = {
            ...existingSlot,
            quantity: existingSlot.quantity + toAdd,
          };
          set({ slots: newSlots });

          remaining -= toAdd;
          continue;
        }
      }

      const emptySlotIndex = currentSlots.findIndex((slot) => slot.item === null);
      if (emptySlotIndex === -1) {
        return false;
      }

      const toAdd = Math.min(remaining, baseItem.maxStack);
      const newSlots = [...currentSlots];
      newSlots[emptySlotIndex] = { item, quantity: toAdd };
      set({ slots: newSlots });

      remaining -= toAdd;
    }

    return true;
  },

  removeItem: (slotIndex: number, quantity = 1): InventoryItem | null => {
    const { slots } = get();
    if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return null;

    const slot = slots[slotIndex];
    if (slot.item === null) return null;

    const removedItem = slot.item;
    const newQuantity = slot.quantity - quantity;

    const newSlots = [...slots];
    if (newQuantity <= 0) {
      newSlots[slotIndex] = { item: null, quantity: 0 };
    } else {
      newSlots[slotIndex] = { ...slot, quantity: newQuantity };
    }
    set({ slots: newSlots });

    return removedItem;
  },

  consumeItem: (slotIndex: number): boolean => {
    const { slots, removeItem } = get();
    if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return false;

    const slot = slots[slotIndex];
    if (slot.item === null) return false;

    const item = slot.item;

    if ('category' in item && item.category === 'consumable') {
      const consumable = item as ConsumableItem;
      const effect = consumable.effect;

      const gameStore = useGameStore.getState();

      switch (effect.type) {
        case 'heal': {
          const { player } = gameStore;
          const newHp = Math.min(player.stats.maxHp, player.stats.hp + effect.amount);
          if (newHp === player.stats.hp) return false;
          gameStore.healPlayer(effect.amount);
          break;
        }
        case 'heal_percent': {
          const { player } = gameStore;
          const healAmount = Math.floor(player.stats.maxHp * effect.percent);
          if (healAmount <= 0) return false;
          const newHp = Math.min(player.stats.maxHp, player.stats.hp + healAmount);
          if (newHp === player.stats.hp) return false;
          gameStore.healPlayer(healAmount);
          break;
        }
        case 'cure_status': {
          gameStore.clearStatusEffect(effect.status === 'all' ? undefined : effect.status);
          break;
        }
        case 'reveal_map': {
          return false;
        }
        case 'teleport': {
          return false;
        }
        case 'identify': {
          return false;
        }
        case 'damage_aoe': {
          return false;
        }
        case 'enchant': {
          const { player } = gameStore;
          if (!player.weapon && !player.armor) return false;
          gameStore.openEnchantModal(slotIndex);
          return true;
        }
        default: {
          const _exhaustiveCheck: never = effect;
          return _exhaustiveCheck;
        }
      }

      removeItem(slotIndex, 1);
      return true;
    }

    return false;
  },

  swapSlots: (fromIndex: number, toIndex: number): void => {
    const { slots } = get();
    if (
      fromIndex < 0 ||
      fromIndex >= INVENTORY_SIZE ||
      toIndex < 0 ||
      toIndex >= INVENTORY_SIZE
    ) {
      return;
    }

    const newSlots = [...slots];
    const temp = newSlots[fromIndex];
    newSlots[fromIndex] = newSlots[toIndex];
    newSlots[toIndex] = temp;
    set({ slots: newSlots });
  },

  selectSlot: (slotIndex: number | null): void => {
    set({ selectedSlot: slotIndex });
  },

  getItemAt: (slotIndex: number): InventoryItem | null => {
    const { slots } = get();
    if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return null;
    return slots[slotIndex].item;
  },

  findItemById: (itemId: ItemId): { slotIndex: number; item: InventoryItem } | null => {
    const { slots } = get();
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].item?.id === itemId) {
        return { slotIndex: i, item: slots[i].item! };
      }
    }
    return null;
  },

  hasItem: (itemId: ItemId): boolean => {
    return get().findItemById(itemId) !== null;
  },

  getFreeSlotCount: (): number => {
    const { slots } = get();
    return slots.filter((slot) => slot.item === null).length;
  },

  clearInventory: (): void => {
    set({ slots: createEmptySlots(), selectedSlot: null });
  },
}));
