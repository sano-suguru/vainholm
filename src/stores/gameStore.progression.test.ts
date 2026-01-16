import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from './gameStore';

describe('useGameStore.applyStatModifiers', () => {
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
  });

  it('applies maxHp modifier and increases hp by same value (clamped)', () => {
    useGameStore.getState().applyStatModifiers([{ stat: 'maxHp', value: 15 }]);

    const { stats } = useGameStore.getState().player;
    expect(stats.maxHp).toBe(25);
    expect(stats.hp).toBe(25);
  });

  it('applies attack/defense modifiers', () => {
    useGameStore.getState().applyStatModifiers([
      { stat: 'attack', value: 3 },
      { stat: 'defense', value: 2 },
    ]);

    const { stats } = useGameStore.getState().player;
    expect(stats.attack).toBe(8);
    expect(stats.defense).toBe(3);
  });
});
