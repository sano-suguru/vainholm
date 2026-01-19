import { beforeEach, describe, expect, it } from 'vitest';

import { useGameStore } from './gameStore';
import type { Ally, StatusEffect } from '../combat/types';
import { createAllyStats } from '../combat/allyTypes';

describe('useGameStore party system', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  const createTestAlly = (overrides?: Partial<Ally>): Ally => ({
    id: 'ally_test_1',
    type: 'skeleton',
    position: { x: 5, y: 5 },
    stats: createAllyStats('skeleton'),
    isAlive: true,
    behaviorMode: 'follow',
    ...overrides,
  });

  describe('addAlly', () => {
    it('adds an ally to the party', () => {
      const ally = createTestAlly();
      useGameStore.getState().addAlly(ally);

      const allies = useGameStore.getState().getAllies();
      expect(allies).toHaveLength(1);
      expect(allies[0].id).toBe('ally_test_1');
      expect(allies[0].type).toBe('skeleton');
    });

    it('supports multiple allies', () => {
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_1' }));
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_2', type: 'ghost' }));
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_3', type: 'cultist' }));

      const allies = useGameStore.getState().getAllies();
      expect(allies).toHaveLength(3);
    });
  });

  describe('removeAlly', () => {
    it('removes an ally from the party', () => {
      const ally = createTestAlly();
      useGameStore.getState().addAlly(ally);
      useGameStore.getState().removeAlly(ally.id);

      const allies = useGameStore.getState().getAllies();
      expect(allies).toHaveLength(0);
    });

    it('removes only the specified ally', () => {
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_1' }));
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_2' }));
      useGameStore.getState().removeAlly('ally_1');

      const allies = useGameStore.getState().getAllies();
      expect(allies).toHaveLength(1);
      expect(allies[0].id).toBe('ally_2');
    });
  });

  describe('updateAlly', () => {
    it('updates ally stats', () => {
      const ally = createTestAlly();
      useGameStore.getState().addAlly(ally);
      useGameStore.getState().updateAlly(ally.id, {
        stats: { ...ally.stats, hp: 5 },
      });

      const allies = useGameStore.getState().getAllies();
      expect(allies[0].stats.hp).toBe(5);
    });

    it('updates ally position', () => {
      const ally = createTestAlly();
      useGameStore.getState().addAlly(ally);
      useGameStore.getState().updateAlly(ally.id, {
        position: { x: 10, y: 15 },
      });

      const allies = useGameStore.getState().getAllies();
      expect(allies[0].position).toEqual({ x: 10, y: 15 });
    });

    it('updates ally behavior mode', () => {
      const ally = createTestAlly({ behaviorMode: 'follow' });
      useGameStore.getState().addAlly(ally);
      useGameStore.getState().updateAlly(ally.id, { behaviorMode: 'aggressive' });

      const allies = useGameStore.getState().getAllies();
      expect(allies[0].behaviorMode).toBe('aggressive');
    });

    it('does nothing for non-existent ally', () => {
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_1' }));
      useGameStore.getState().updateAlly('non_existent', { behaviorMode: 'aggressive' });

      const allies = useGameStore.getState().getAllies();
      expect(allies).toHaveLength(1);
      expect(allies[0].behaviorMode).toBe('follow');
    });
  });

  describe('getAllyAt', () => {
    it('returns ally at position', () => {
      const ally = createTestAlly({ position: { x: 7, y: 8 } });
      useGameStore.getState().addAlly(ally);

      const foundAlly = useGameStore.getState().getAllyAt(7, 8);
      expect(foundAlly).not.toBeNull();
      expect(foundAlly?.id).toBe('ally_test_1');
    });

    it('returns null for empty position', () => {
      const ally = createTestAlly({ position: { x: 7, y: 8 } });
      useGameStore.getState().addAlly(ally);

      const foundAlly = useGameStore.getState().getAllyAt(1, 1);
      expect(foundAlly).toBeNull();
    });

    it('ignores dead allies', () => {
      const ally = createTestAlly({ position: { x: 7, y: 8 }, isAlive: false });
      useGameStore.getState().addAlly(ally);

      const foundAlly = useGameStore.getState().getAllyAt(7, 8);
      expect(foundAlly).toBeNull();
    });
  });

  describe('getAllies', () => {
    it('returns only alive allies', () => {
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_1', isAlive: true }));
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_2', isAlive: false }));
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_3', isAlive: true }));

      const allies = useGameStore.getState().getAllies();
      expect(allies).toHaveLength(2);
      expect(allies.map((a) => a.id)).toEqual(['ally_1', 'ally_3']);
    });
  });

  describe('setAllyBehaviorMode', () => {
    it('changes ally behavior mode', () => {
      const ally = createTestAlly({ behaviorMode: 'follow' });
      useGameStore.getState().addAlly(ally);
      useGameStore.getState().setAllyBehaviorMode(ally.id, 'wait');

      const allies = useGameStore.getState().getAllies();
      expect(allies[0].behaviorMode).toBe('wait');
    });

    it('does nothing for non-existent ally', () => {
      const ally = createTestAlly({ behaviorMode: 'follow' });
      useGameStore.getState().addAlly(ally);
      useGameStore.getState().setAllyBehaviorMode('non_existent', 'aggressive');

      const allies = useGameStore.getState().getAllies();
      expect(allies[0].behaviorMode).toBe('follow');
    });
  });

  describe('clearAllies', () => {
    it('removes all allies', () => {
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_1' }));
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_2' }));
      useGameStore.getState().addAlly(createTestAlly({ id: 'ally_3' }));

      useGameStore.getState().clearAllies();

      const allies = useGameStore.getState().getAllies();
      expect(allies).toHaveLength(0);
    });
  });

  describe('ally status effects', () => {
    it('adds status effects to ally', () => {
      const poisonEffect: StatusEffect = {
        id: 'poison',
        duration: 3,
        stacks: 1,
        source: 'enemy',
      };
      const statusEffects = new Map([['poison', poisonEffect] as const]);
      const ally = createTestAlly({ statusEffects });
      useGameStore.getState().addAlly(ally);

      const allies = useGameStore.getState().getAllies();
      expect(allies[0].statusEffects?.has('poison')).toBe(true);
      expect(allies[0].statusEffects?.get('poison')?.duration).toBe(3);
    });

    it('updates ally status effects', () => {
      const ally = createTestAlly();
      useGameStore.getState().addAlly(ally);

      const burnEffect: StatusEffect = {
        id: 'burn',
        duration: 2,
        stacks: 1,
        source: 'enemy',
      };
      const newStatusEffects = new Map([['burn', burnEffect] as const]);
      useGameStore.getState().updateAlly(ally.id, { statusEffects: newStatusEffects });

      const allies = useGameStore.getState().getAllies();
      expect(allies[0].statusEffects?.has('burn')).toBe(true);
    });
  });
});
