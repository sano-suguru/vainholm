import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { EnemyTypeId, BossTypeId, CharacterClassId } from '../combat/types';
import type { RemnantId } from '../progression/remnants';
import { REMNANT_IDS } from '../progression/remnants';

export interface EnemyEncounter {
  firstEncounterFloor: number;
  timesDefeated: number;
  lastEncounterTimestamp: number;
}

export interface RelicDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  effect: RelicEffect;
}

export type RelicEffect =
  | { type: 'vision_bonus'; amount: number }
  | { type: 'max_hp_bonus'; amount: number }
  | { type: 'resistance'; element: 'fire' | 'ice' | 'poison' }
  | { type: 'starting_item'; itemId: string };

export interface UnlockCondition {
  type: 'defeat_boss' | 'reach_floor' | 'defeat_enemies' | 'find_relic';
  target: string;
  count?: number;
}

export interface Unlock {
  id: string;
  name: string;
  displayName: string;
  description: string;
  condition: UnlockCondition;
  unlocked: boolean;
}

export interface RemnantTradeRecord {
  remnantId: RemnantId;
  tradeId: string;
  floor: number;
  timestamp: number;
}

interface MetaProgressionState {
  enemyEncounters: Record<EnemyTypeId, EnemyEncounter>;
  bossEncounters: Record<BossTypeId, EnemyEncounter>;
  discoveredRelics: string[];
  equippedRelics: string[];
  unlocks: Record<string, boolean>;
  deepestFloorReached: number;
  totalRuns: number;
  totalDeaths: number;
  totalVictories: number;
  advancedModeUnlocked: boolean;
  remnantTrades: RemnantTradeRecord[];
  currentRunRemnantTrades: RemnantTradeRecord[];
}

export interface LegacyPointsBreakdown {
  floorBonus: number;
  enemyBonus: number;
  bossBonus: number;
  total: number;
}

interface MetaProgressionActions {
  recordEnemyEncounter: (enemyType: EnemyTypeId, floor: number, defeated: boolean) => void;
  recordBossEncounter: (bossType: BossTypeId, floor: number, defeated: boolean) => void;
  calculateLegacyPoints: (finalFloor: number, enemiesDefeated: number, bossesDefeated: number) => LegacyPointsBreakdown;
  discoverRelic: (relicId: string) => void;
  equipRelic: (relicId: string) => void;
  unequipRelic: (relicId: string) => void;
  checkUnlock: (unlockId: string) => boolean;
  setUnlock: (unlockId: string, unlocked: boolean) => void;
  updateDeepestFloor: (floor: number) => void;
  recordRunEnd: (victory: boolean) => void;
  unlockAdvancedMode: () => void;
  isAdvancedModeUnlocked: () => boolean;
  hasEncounteredEnemy: (enemyType: EnemyTypeId) => boolean;
  hasDefeatedBoss: (bossType: BossTypeId) => boolean;
  getEnemyEncounter: (enemyType: EnemyTypeId) => EnemyEncounter | null;
  recordRemnantTrade: (remnantId: RemnantId, tradeId: string, floor: number) => void;
  hasTradeWithRemnant: (remnantId: RemnantId) => boolean;
  hasTradeWithAllRemnants: () => boolean;
  getCurrentRunRemnantTrades: () => RemnantTradeRecord[];
  clearCurrentRunRemnantTrades: () => void;
  isClassUnlocked: (classId: CharacterClassId) => boolean;
  resetProgress: () => void;
}

type MetaProgressionStore = MetaProgressionState & MetaProgressionActions;

const MAX_EQUIPPED_RELICS = 2;

const createInitialState = (): MetaProgressionState => ({
  enemyEncounters: {} as Record<EnemyTypeId, EnemyEncounter>,
  bossEncounters: {} as Record<BossTypeId, EnemyEncounter>,
  discoveredRelics: [],
  equippedRelics: [],
  unlocks: {},
  deepestFloorReached: 0,
  totalRuns: 0,
  totalDeaths: 0,
  totalVictories: 0,
  advancedModeUnlocked: false,
  remnantTrades: [],
  currentRunRemnantTrades: [],
});

export const useMetaProgressionStore = create<MetaProgressionStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      recordEnemyEncounter: (enemyType, floor, defeated) => {
        set((state) => {
          const existing = state.enemyEncounters[enemyType];
          const updated: EnemyEncounter = existing
            ? {
                ...existing,
                timesDefeated: defeated ? existing.timesDefeated + 1 : existing.timesDefeated,
                lastEncounterTimestamp: Date.now(),
              }
            : {
                firstEncounterFloor: floor,
                timesDefeated: defeated ? 1 : 0,
                lastEncounterTimestamp: Date.now(),
              };

          return {
            enemyEncounters: {
              ...state.enemyEncounters,
              [enemyType]: updated,
            },
          };
        });
      },

      recordBossEncounter: (bossType, floor, defeated) => {
        set((state) => {
          const existing = state.bossEncounters[bossType];
          const updated: EnemyEncounter = existing
            ? {
                ...existing,
                timesDefeated: defeated ? existing.timesDefeated + 1 : existing.timesDefeated,
                lastEncounterTimestamp: Date.now(),
              }
            : {
                firstEncounterFloor: floor,
                timesDefeated: defeated ? 1 : 0,
                lastEncounterTimestamp: Date.now(),
              };

          return {
            bossEncounters: {
              ...state.bossEncounters,
              [bossType]: updated,
            },
          };
        });
      },

      calculateLegacyPoints: (finalFloor, enemiesDefeated, bossesDefeated) => {
        const floorBonus = finalFloor * 10;
        const enemyBonus = enemiesDefeated;
        const bossBonus = bossesDefeated * 50;
        return {
          floorBonus,
          enemyBonus,
          bossBonus,
          total: floorBonus + enemyBonus + bossBonus,
        };
      },

      discoverRelic: (relicId) => {
        set((state) => {
          if (state.discoveredRelics.includes(relicId)) return state;
          return {
            discoveredRelics: [...state.discoveredRelics, relicId],
          };
        });
      },

      equipRelic: (relicId) => {
        set((state) => {
          if (state.equippedRelics.includes(relicId)) return state;
          if (state.equippedRelics.length >= MAX_EQUIPPED_RELICS) return state;
          if (!state.discoveredRelics.includes(relicId)) return state;
          return {
            equippedRelics: [...state.equippedRelics, relicId],
          };
        });
      },

      unequipRelic: (relicId) => {
        set((state) => ({
          equippedRelics: state.equippedRelics.filter((id) => id !== relicId),
        }));
      },

      checkUnlock: (unlockId) => {
        return get().unlocks[unlockId] ?? false;
      },

      setUnlock: (unlockId, unlocked) => {
        set((state) => ({
          unlocks: {
            ...state.unlocks,
            [unlockId]: unlocked,
          },
        }));
      },

      updateDeepestFloor: (floor) => {
        set((state) => ({
          deepestFloorReached: Math.max(state.deepestFloorReached, floor),
        }));
      },

      recordRunEnd: (victory) => {
        set((state) => ({
          totalRuns: state.totalRuns + 1,
          totalDeaths: victory ? state.totalDeaths : state.totalDeaths + 1,
          totalVictories: victory ? state.totalVictories + 1 : state.totalVictories,
        }));
      },

      unlockAdvancedMode: () => {
        set({ advancedModeUnlocked: true });
      },

      isAdvancedModeUnlocked: () => {
        return get().advancedModeUnlocked;
      },

      hasEncounteredEnemy: (enemyType) => {
        return enemyType in get().enemyEncounters;
      },

      hasDefeatedBoss: (bossType) => {
        const encounter = get().bossEncounters[bossType];
        return encounter ? encounter.timesDefeated > 0 : false;
      },

      getEnemyEncounter: (enemyType) => {
        return get().enemyEncounters[enemyType] ?? null;
      },

      recordRemnantTrade: (remnantId, tradeId, floor) => {
        const record: RemnantTradeRecord = {
          remnantId,
          tradeId,
          floor,
          timestamp: Date.now(),
        };
        set((state) => ({
          remnantTrades: [...state.remnantTrades, record],
          currentRunRemnantTrades: [...state.currentRunRemnantTrades, record],
        }));
      },

      hasTradeWithRemnant: (remnantId) => {
        return get().currentRunRemnantTrades.some((r) => r.remnantId === remnantId);
      },

      hasTradeWithAllRemnants: () => {
        const trades = get().currentRunRemnantTrades;
        const tradedRemnantIds = new Set(trades.map((t) => t.remnantId));
        return REMNANT_IDS.every((id) => tradedRemnantIds.has(id));
      },

      getCurrentRunRemnantTrades: () => {
        return get().currentRunRemnantTrades;
      },

      clearCurrentRunRemnantTrades: () => {
        set({ currentRunRemnantTrades: [] });
      },

      isClassUnlocked: (classId) => {
        const state = get();
        switch (classId) {
          case 'warrior':
            return true;
          case 'hunter':
            return state.deepestFloorReached >= 4;
          case 'scholar': {
            const totalBossesDefeated = Object.values(state.bossEncounters).reduce(
              (sum, enc) => sum + enc.timesDefeated,
              0
            );
            return totalBossesDefeated >= 1;
          }
          default:
            return false;
        }
      },

      resetProgress: () => {
        set(createInitialState());
      },
    }),
    {
      name: 'vainholm-meta-progression',
    }
  )
);
