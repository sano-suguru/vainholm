import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from '../stores/gameStore';
import { useProgressionStore } from './progressionStore';

describe('useProgressionStore.selectUpgrade', () => {
  beforeEach(() => {
    useGameStore.setState({
      player: {
        ...useGameStore.getState().player,
        stats: {
          hp: 10,
          maxHp: 10,
          attack: 5,
          defense: 1,
        },
      },
    });

    useProgressionStore.setState({
      currentLevel: 0,
      acquiredUpgrades: [],
      activeAbilities: [],
      passiveEffects: [],
      pendingLevelUp: true,
      currentChoices: null,

      checkLevelUp: useProgressionStore.getState().checkLevelUp,
      generateChoices: useProgressionStore.getState().generateChoices,
      triggerLevelUp: useProgressionStore.getState().triggerLevelUp,
      selectUpgrade: useProgressionStore.getState().selectUpgrade,
      dismissLevelUp: useProgressionStore.getState().dismissLevelUp,
      hasPassiveEffect: useProgressionStore.getState().hasPassiveEffect,
      hasUpgrade: useProgressionStore.getState().hasUpgrade,
      useActiveAbility: useProgressionStore.getState().useActiveAbility,
      resetProgression: useProgressionStore.getState().resetProgression,
    });
  });

  it('records acquired upgrade and applies stat modifiers via gameStore', () => {
    useProgressionStore.getState().selectUpgrade('tough');

    const progression = useProgressionStore.getState();
    expect(progression.acquiredUpgrades).toContain('tough');
    expect(progression.currentLevel).toBe(1);
    expect(progression.pendingLevelUp).toBe(false);
    expect(progression.currentChoices).toBe(null);

    const { stats } = useGameStore.getState().player;
    expect(stats.maxHp).toBe(25);
    expect(stats.hp).toBe(25);
  });
});
