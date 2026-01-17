import { create } from 'zustand';

import type { Position } from '../types';

export interface DamageNumber {
  id: string;
  position: Position;
  amount: number;
  isCritical: boolean;
  isHeal: boolean;
  createdAt: number;
}

interface DamageNumberStore {
  damageNumbers: DamageNumber[];
  addDamageNumber: (position: Position, amount: number, isCritical?: boolean, isHeal?: boolean) => void;
  removeDamageNumber: (id: string) => void;
  clearExpired: () => void;
  clearAll: () => void;
}

let damageNumberIdCounter = 0;

const DAMAGE_NUMBER_DURATION = 1200;

const createTimeoutRegistry = () => new Map<string, ReturnType<typeof setTimeout>>();

export const useDamageNumberStore = create<DamageNumberStore>((set, get) => {
  const timeouts = createTimeoutRegistry();

  return {
    damageNumbers: [],

    addDamageNumber: (position, amount, isCritical = false, isHeal = false) => {
      const id = `dmg_${++damageNumberIdCounter}`;
      const now = Date.now();

      set((state) => ({
        damageNumbers: [
          ...state.damageNumbers,
          {
            id,
            position: { ...position },
            amount,
            isCritical,
            isHeal,
            createdAt: now,
          },
        ],
      }));

      const timeoutId = setTimeout(() => {
        get().removeDamageNumber(id);
      }, DAMAGE_NUMBER_DURATION);

      timeouts.set(id, timeoutId);
    },

    removeDamageNumber: (id) => {
      const timeoutId = timeouts.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeouts.delete(id);
      }

      set((state) => ({
        damageNumbers: state.damageNumbers.filter((d) => d.id !== id),
      }));
    },

    clearExpired: () => {
      const now = Date.now();
      const expiredIds: string[] = [];

      set((state) => ({
        damageNumbers: state.damageNumbers.filter((d) => {
          const isAlive = now - d.createdAt < DAMAGE_NUMBER_DURATION;
          if (!isAlive) {
            expiredIds.push(d.id);
          }
          return isAlive;
        }),
      }));

      for (const id of expiredIds) {
        const timeoutId = timeouts.get(id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeouts.delete(id);
        }
      }
    },

    clearAll: () => {
      for (const timeoutId of timeouts.values()) {
        clearTimeout(timeoutId);
      }
      timeouts.clear();
      set({ damageNumbers: [] });
    },
  };
});

export const DAMAGE_NUMBER_DURATION_MS = DAMAGE_NUMBER_DURATION;
