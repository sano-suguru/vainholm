import { beforeEach, describe, expect, it } from 'vitest';

import { useMetaProgressionStore } from './metaProgressionStore';

describe('useMetaProgressionStore.remnantTrades', () => {
  beforeEach(() => {
    useMetaProgressionStore.getState().resetProgress();
  });

  describe('hasTradeWithAllRemnants', () => {
    it('returns false when no trades recorded', () => {
      expect(useMetaProgressionStore.getState().hasTradeWithAllRemnants()).toBe(false);
    });

    it('returns false when only some remnants traded', () => {
      const store = useMetaProgressionStore.getState();
      store.recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      store.recordRemnantTrade('halfvita', 'halfvita_attack_buff', 4);

      expect(useMetaProgressionStore.getState().hasTradeWithAllRemnants()).toBe(false);
    });

    it('returns true when all four remnants traded', () => {
      const store = useMetaProgressionStore.getState();
      store.recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      store.recordRemnantTrade('halfvita', 'halfvita_attack_buff', 4);
      store.recordRemnantTrade('bundinn', 'bundinn_relic_crown', 6);
      store.recordRemnantTrade('ginandi', 'ginandi_full_heal', 8);

      expect(useMetaProgressionStore.getState().hasTradeWithAllRemnants()).toBe(true);
    });

    it('returns true even with multiple trades per remnant', () => {
      const store = useMetaProgressionStore.getState();
      store.recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      store.recordRemnantTrade('eineygi', 'eineygi_reveal_traps', 2);
      store.recordRemnantTrade('halfvita', 'halfvita_attack_buff', 4);
      store.recordRemnantTrade('bundinn', 'bundinn_relic_crown', 6);
      store.recordRemnantTrade('ginandi', 'ginandi_full_heal', 8);

      expect(useMetaProgressionStore.getState().hasTradeWithAllRemnants()).toBe(true);
    });
  });

  describe('hasTradeWithRemnant', () => {
    it('returns false when remnant not traded', () => {
      expect(useMetaProgressionStore.getState().hasTradeWithRemnant('eineygi')).toBe(false);
    });

    it('returns true when remnant traded', () => {
      useMetaProgressionStore.getState().recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      expect(useMetaProgressionStore.getState().hasTradeWithRemnant('eineygi')).toBe(true);
    });
  });

  describe('clearCurrentRunRemnantTrades', () => {
    it('clears current run trades but preserves total trades', () => {
      const store = useMetaProgressionStore.getState();
      store.recordRemnantTrade('eineygi', 'eineygi_reveal_region', 2);
      store.recordRemnantTrade('halfvita', 'halfvita_attack_buff', 4);

      expect(useMetaProgressionStore.getState().currentRunRemnantTrades).toHaveLength(2);
      expect(useMetaProgressionStore.getState().remnantTrades).toHaveLength(2);

      useMetaProgressionStore.getState().clearCurrentRunRemnantTrades();

      expect(useMetaProgressionStore.getState().currentRunRemnantTrades).toHaveLength(0);
      expect(useMetaProgressionStore.getState().remnantTrades).toHaveLength(2);
    });
  });
});
