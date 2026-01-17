import { create } from 'zustand';

import type { Item, ItemId, InventorySlot, ConsumableItem } from './types';
import { INVENTORY_SIZE } from './types';
import { useGameStore } from '../stores/gameStore';

interface InventoryStore {
  slots: InventorySlot[];
  selectedSlot: number | null;

  addItem: (item: Item, quantity?: number) => boolean;
  removeItem: (slotIndex: number, quantity?: number) => Item | null;
  useItem: (slotIndex: number) => boolean;
  swapSlots: (fromIndex: number, toIndex: number) => void;
  selectSlot: (slotIndex: number | null) => void;
  getItemAt: (slotIndex: number) => Item | null;
  findItemById: (itemId: ItemId) => { slotIndex: number; item: Item } | null;
  hasItem: (itemId: ItemId) => boolean;
  getFreeSlotCount: () => number;
  clearInventory: () => void;
}

const createEmptySlots = (): InventorySlot[] =>
  Array.from({ length: INVENTORY_SIZE }, () => ({ item: null, quantity: 0 }));

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  slots: createEmptySlots(),
  selectedSlot: null,

  addItem: (item: Item, quantity = 1): boolean => {
    let remaining = quantity;

    while (remaining > 0) {
      const { slots } = get();

      if (item.stackable) {
        const existingSlotIndex = slots.findIndex(
          (slot) =>
            slot.item !== null &&
            slot.item.category === item.category &&
            'consumableType' in slot.item &&
            'consumableType' in item &&
            slot.item.consumableType === item.consumableType &&
            slot.quantity < item.maxStack
        );

        if (existingSlotIndex !== -1) {
          const existingSlot = slots[existingSlotIndex];
          const spaceAvailable = item.maxStack - existingSlot.quantity;
          const toAdd = Math.min(remaining, spaceAvailable);

          const newSlots = [...slots];
          newSlots[existingSlotIndex] = {
            ...existingSlot,
            quantity: existingSlot.quantity + toAdd,
          };
          set({ slots: newSlots });

          remaining -= toAdd;
          continue;
        }
      }

      const emptySlotIndex = slots.findIndex((slot) => slot.item === null);
      if (emptySlotIndex === -1) {
        return false;
      }

      const toAdd = Math.min(remaining, item.maxStack);
      const newSlots = [...slots];
      newSlots[emptySlotIndex] = { item, quantity: toAdd };
      set({ slots: newSlots });

      remaining -= toAdd;
    }

    return true;
  },

  removeItem: (slotIndex: number, quantity = 1): Item | null => {
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

  useItem: (slotIndex: number): boolean => {
    const { slots, removeItem } = get();
    if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return false;

    const slot = slots[slotIndex];
    if (slot.item === null) return false;

    const item = slot.item;

    if (item.category === 'consumable') {
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

  getItemAt: (slotIndex: number): Item | null => {
    const { slots } = get();
    if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return null;
    return slots[slotIndex].item;
  },

  findItemById: (itemId: ItemId): { slotIndex: number; item: Item } | null => {
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
