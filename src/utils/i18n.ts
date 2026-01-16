import type { EnemyTypeId } from '../combat/types';
import type { DungeonTheme } from '../dungeon/types';
import {
  enemy_skeleton,
  enemy_ghost,
  enemy_cultist,
  region_hrodrgraf,
  region_rotmyrkr,
  region_gleymdariki,
  region_upphafsdjup,
  region_frostdjup,
  region_sannleiksholmr,
  region_world,
  region_unknown,
} from '../paraglide/messages.js';

/**
 * Get localized enemy name by type ID
 */
const ENEMY_NAME_MAP: Record<EnemyTypeId, () => string> = {
  skeleton: enemy_skeleton,
  ghost: enemy_ghost,
  cultist: enemy_cultist,
};

export function getLocalizedEnemyName(typeId: EnemyTypeId): string {
  return ENEMY_NAME_MAP[typeId]();
}

const REGION_NAME_MAP: Record<DungeonTheme, () => string> = {
  hrodrgraf: region_hrodrgraf,
  rotmyrkr: region_rotmyrkr,
  gleymdariki: region_gleymdariki,
  upphafsdjup: region_upphafsdjup,
  frostdjup: region_frostdjup,
  sannleiksholmr: region_sannleiksholmr,
};

/**
 * Get localized region name by theme
 */
export function getLocalizedRegionName(theme: DungeonTheme): string {
  const getMessage = REGION_NAME_MAP[theme];
  return getMessage();
}

/**
 * Get localized world (overworld) name
 */
export function getLocalizedWorldName(): string {
  return region_world();
}

export function getLocalizedUnknownRegionName(): string {
  return region_unknown();
}
