import type { Boss } from '../combat/types';
import type { DungeonFloor, Room } from './types';
import type { EnemyRegion } from '../combat/enemyTypes';
import { getBossForFloor, createBossStats, BOSS_TYPES } from '../combat/enemyTypes';
import { useGameStore } from '../stores/gameStore';

let bossIdCounter = 0;

function themeToRegion(theme: string): EnemyRegion {
  switch (theme) {
    case 'hrodrgraf':
      return 'hrodrgraf';
    case 'rotmyrkr':
      return 'rotmyrkr';
    case 'gleymdariki':
      return 'gleymdariki';
    case 'upphafsdjup':
      return 'upphafsdjup';
    default:
      return 'hrodrgraf';
  }
}

export function spawnBossForFloor(floor: DungeonFloor): Boss | null {
  const region = themeToRegion(floor.theme);
  const bossTypeId = getBossForFloor(floor.level, region);

  if (!bossTypeId) {
    useGameStore.getState().setBoss(null);
    return null;
  }

  const bossRoom = floor.rooms.find((r: Room) => r.roomType === 'boss');
  if (!bossRoom) {
    useGameStore.getState().setBoss(null);
    return null;
  }

  const bossDef = BOSS_TYPES[bossTypeId];
  const stats = createBossStats(bossTypeId, 0);

  const boss: Boss = {
    id: `boss-${++bossIdCounter}`,
    type: bossTypeId,
    position: { ...bossRoom.center },
    stats,
    isAlive: true,
    isAware: false,
    phase: 0,
    maxPhases: bossDef.phases,
  };

  useGameStore.getState().setBoss(boss);

  return boss;
}

export function clearCurrentBoss(): void {
  useGameStore.getState().setBoss(null);
}

export function isBossFloor(floor: number, theme: string): boolean {
  const region = themeToRegion(theme);
  return getBossForFloor(floor, region) !== null;
}
