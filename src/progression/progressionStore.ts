import { create } from 'zustand';

import type {
  UpgradeDefinition,
  UpgradeId,
  PassiveEffectId,
  ActiveAbilityState,
  ActiveAbilityId,
} from './types';
import { UPGRADE_POOL, getUpgradeById } from './upgrades';
import { useGameStore } from '../stores/gameStore';

const CHOICES_PER_LEVEL_UP = 4;
const FLOORS_PER_LEVEL_UP = 2;

interface ProgressionStore {
  currentLevel: number;
  acquiredUpgrades: UpgradeId[];
  activeAbilities: ActiveAbilityState[];
  passiveEffects: PassiveEffectId[];
  pendingLevelUp: boolean;
  currentChoices: UpgradeDefinition[] | null;

  checkLevelUp: (floor: number) => boolean;
  generateChoices: (floor: number) => UpgradeDefinition[];
  triggerLevelUp: (floor: number) => void;
  selectUpgrade: (upgradeId: UpgradeId) => void;
  dismissLevelUp: () => void;
  hasPassiveEffect: (effect: PassiveEffectId) => boolean;
  hasUpgrade: (upgradeId: UpgradeId) => boolean;
  useActiveAbility: (abilityId: ActiveAbilityId) => boolean;
  resetProgression: () => void;
}

function selectWeightedRandom<T extends { weight?: number }>(
  items: T[],
  count: number,
  rng: () => number
): T[] {
  const available = [...items];
  const selected: T[] = [];

  while (selected.length < count && available.length > 0) {
    const totalWeight = available.reduce((sum, item) => sum + (item.weight ?? 1), 0);
    let random = rng() * totalWeight;

    for (let i = 0; i < available.length; i++) {
      random -= available[i].weight ?? 1;
      if (random <= 0) {
        selected.push(available[i]);
        available.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

export const useProgressionStore = create<ProgressionStore>((set, get) => ({
  currentLevel: 0,
  acquiredUpgrades: [],
  activeAbilities: [],
  passiveEffects: [],
  pendingLevelUp: false,
  currentChoices: null,

  checkLevelUp: (floor: number) => {
    const { currentLevel } = get();
    const expectedLevel = Math.floor(floor / FLOORS_PER_LEVEL_UP);
    return expectedLevel > currentLevel;
  },

  generateChoices: (floor: number) => {
    const { acquiredUpgrades } = get();

    const eligible = UPGRADE_POOL.filter((upgrade) => {
      if (acquiredUpgrades.includes(upgrade.id)) return false;
      if (upgrade.minFloor && floor < upgrade.minFloor) return false;
      if (upgrade.maxFloor && floor > upgrade.maxFloor) return false;
      if (upgrade.requiredUpgrades?.some((req) => !acquiredUpgrades.includes(req))) {
        return false;
      }
      if (upgrade.excludedUpgrades?.some((exc) => acquiredUpgrades.includes(exc))) {
        return false;
      }
      return true;
    });

    return selectWeightedRandom(eligible, CHOICES_PER_LEVEL_UP, Math.random);
  },

  triggerLevelUp: (floor: number) => {
    const choices = get().generateChoices(floor);
    set({
      pendingLevelUp: true,
      currentChoices: choices,
    });
  },

  selectUpgrade: (upgradeId: UpgradeId) => {
    const upgrade = getUpgradeById(upgradeId);
    if (!upgrade) return;

    if (upgrade.statModifiers) {
      useGameStore.getState().applyStatModifiers(upgrade.statModifiers);
    }

    set((state) => {
      const nextPassiveEffects = upgrade.passiveEffect
        ? [...state.passiveEffects, upgrade.passiveEffect]
        : state.passiveEffects;

      const nextActiveAbilities = upgrade.activeAbility
        ? [
            ...state.activeAbilities,
            {
              id: upgrade.activeAbility,
              usesRemaining: 1,
              cooldown: 0,
            } satisfies ActiveAbilityState,
          ]
        : state.activeAbilities;

      return {
        ...state,
        currentLevel: state.currentLevel + 1,
        acquiredUpgrades: [...state.acquiredUpgrades, upgradeId],
        passiveEffects: nextPassiveEffects,
        activeAbilities: nextActiveAbilities,
        pendingLevelUp: false,
        currentChoices: null,
      };
    });
  },

  dismissLevelUp: () => {
    set({
      pendingLevelUp: false,
      currentChoices: null,
    });
  },

  hasPassiveEffect: (effect: PassiveEffectId) => {
    return get().passiveEffects.includes(effect);
  },

  hasUpgrade: (upgradeId: UpgradeId) => {
    return get().acquiredUpgrades.includes(upgradeId);
  },

  useActiveAbility: (abilityId: ActiveAbilityId) => {
    const { activeAbilities } = get();
    const ability = activeAbilities.find((a) => a.id === abilityId);
    if (!ability || ability.usesRemaining <= 0) return false;

    set({
      activeAbilities: activeAbilities.map((a) =>
        a.id === abilityId ? { ...a, usesRemaining: a.usesRemaining - 1 } : a
      ),
    });
    return true;
  },

  resetProgression: () => {
    set({
      currentLevel: 0,
      acquiredUpgrades: [],
      activeAbilities: [],
      passiveEffects: [],
      pendingLevelUp: false,
      currentChoices: null,
    });
  },
}));
