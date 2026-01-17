import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from './gameStore';
import { useMetaProgressionStore } from './metaProgressionStore';
import { useDungeonStore } from '../dungeon/dungeonStore';

describe('useGameStore.damageBoss victory conditions', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    useMetaProgressionStore.getState().resetProgress();
  });

  const setupFinalBoss = () => {
    useDungeonStore.setState({
      dungeon: {
        id: 'test-dungeon',
        name: 'Test Dungeon',
        regions: [],
        baseSeed: 12345,
        maxFloors: 8,
        currentFloor: 8,
        deepestReached: 8,
        floors: new Map(),
      },
      isInDungeon: true,
    });

    useGameStore.getState().setBoss({
      id: 'boss_1',
      type: 'oerslbarn',
      position: { x: 10, y: 10 },
      stats: { hp: 10, maxHp: 100, attack: 15, defense: 5 },
      phase: 1,
      maxPhases: 2,
      isAlive: true,
      isAware: true,
    });
  };

  describe('normal victory', () => {
    it('sets gameEndState to victory when final boss killed without all remnant trades', () => {
      setupFinalBoss();

      useGameStore.getState().damageBoss(100);

      expect(useGameStore.getState().gameEndState).toBe('victory');
    });

    it('sets gameEndState to victory when only some remnants traded', () => {
      setupFinalBoss();
      
      const metaStore = useMetaProgressionStore.getState();
      metaStore.recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      metaStore.recordRemnantTrade('halfvita', 'halfvita_attack_buff', 4);

      useGameStore.getState().damageBoss(100);

      expect(useGameStore.getState().gameEndState).toBe('victory');
    });
  });

  describe('true ending (victory_true)', () => {
    it('sets gameEndState to victory_true when final boss killed with all remnant trades', () => {
      setupFinalBoss();

      const metaStore = useMetaProgressionStore.getState();
      metaStore.recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      metaStore.recordRemnantTrade('halfvita', 'halfvita_attack_buff', 4);
      metaStore.recordRemnantTrade('bundinn', 'bundinn_relic_crown', 6);
      metaStore.recordRemnantTrade('ginandi', 'ginandi_full_heal', 8);

      useGameStore.getState().damageBoss(100);

      expect(useGameStore.getState().gameEndState).toBe('victory_true');
    });
  });

  describe('non-final boss', () => {
    it('does not set gameEndState when non-final boss killed', () => {
      useDungeonStore.setState({
        dungeon: {
          id: 'test-dungeon',
          name: 'Test Dungeon',
          regions: [],
          baseSeed: 12345,
          maxFloors: 8,
          currentFloor: 4,
          deepestReached: 4,
          floors: new Map(),
        },
        isInDungeon: true,
      });

      useGameStore.getState().setBoss({
        id: 'boss_1',
        type: 'rotgroftr',
        position: { x: 10, y: 10 },
        stats: { hp: 10, maxHp: 100, attack: 10, defense: 3 },
        phase: 1,
        maxPhases: 2,
        isAlive: true,
        isAware: true,
      });

      const metaStore = useMetaProgressionStore.getState();
      metaStore.recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      metaStore.recordRemnantTrade('halfvita', 'halfvita_attack_buff', 4);
      metaStore.recordRemnantTrade('bundinn', 'bundinn_relic_crown', 6);
      metaStore.recordRemnantTrade('ginandi', 'ginandi_full_heal', 8);

      useGameStore.getState().damageBoss(100);

      expect(useGameStore.getState().gameEndState).toBe('playing');
    });
  });
});
