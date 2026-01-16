import { describe, expect, it } from 'vitest';

import {
  getLocalizedEnemyName,
  getLocalizedRegionName,
  getLocalizedUnknownRegionName,
  getLocalizedWorldName,
} from './i18n';

describe('i18n helpers', () => {
  it('returns a localized name for each EnemyTypeId', () => {
    expect(getLocalizedEnemyName('skeleton')).not.toBe('');
    expect(getLocalizedEnemyName('ghost')).not.toBe('');
    expect(getLocalizedEnemyName('cultist')).not.toBe('');
  });

  it('returns a localized name for world (overworld)', () => {
    expect(getLocalizedWorldName()).not.toBe('');
  });

  it('returns a localized name for unknown region placeholder', () => {
    expect(getLocalizedUnknownRegionName()).not.toBe('');
  });

  it('returns a localized name for each DungeonTheme', () => {
    expect(getLocalizedRegionName('hrodrgraf')).not.toBe('');
    expect(getLocalizedRegionName('rotmyrkr')).not.toBe('');
    expect(getLocalizedRegionName('gleymdariki')).not.toBe('');
    expect(getLocalizedRegionName('upphafsdjup')).not.toBe('');
    expect(getLocalizedRegionName('frostdjup')).not.toBe('');
    expect(getLocalizedRegionName('sannleiksholmr')).not.toBe('');
  });
});
