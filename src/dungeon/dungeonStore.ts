import { create } from 'zustand';
import type { Dungeon, DungeonFloor, GameMode, RegionConfig } from './types';
import { getCollapsedFloor, getTurnsUntilCollapse, isPlayerCaughtByCollapse } from './types';
import { generateFloor } from './generator';
import { getFloorsPerRegion, getRegionConfigForFloor, getTotalFloors, REGION_CONFIGS } from './config';
import { spawnBossForFloor } from './bossSpawner';

const FLOOR_SEED_MULTIPLIER = 1000;

interface DungeonStore {
  dungeon: Dungeon | null;
  isInDungeon: boolean;
  gameMode: GameMode;
  collapseEnabled: boolean;
  customSeed: number | null;

  setGameMode: (mode: GameMode) => void;
  setCollapseEnabled: (enabled: boolean) => void;
  setCustomSeed: (seed: number | null) => void;
  getEffectiveSeed: (fallbackSeed: number) => number;
  enterDungeon: (seed: number) => DungeonFloor;
  exitDungeon: () => void;
  goToFloor: (level: number) => DungeonFloor | null;
  descendStairs: () => DungeonFloor | null;
  ascendStairs: (tick: number) => DungeonFloor | null;

  getCurrentFloor: () => DungeonFloor | null;
  getFloor: (level: number) => DungeonFloor | null;
  getCurrentRegion: () => RegionConfig | null;
  
  getCollapsedFloor: (tick: number) => number;
  getTurnsUntilCollapse: (tick: number) => number | null;
  isFloorCollapsed: (floor: number, tick: number) => boolean;
  checkCollapseGameOver: (tick: number) => boolean;
}

function generateFloorForLevel(
  dungeon: Dungeon,
  level: number,
  gameMode: GameMode
): DungeonFloor | null {
  const regionConfig = getRegionConfigForFloor(level, gameMode);
  if (!regionConfig) return null;

  const existingFloor = dungeon.floors.get(level);
  if (existingFloor) {
    existingFloor.visited = true;
    return existingFloor;
  }

  const floorSeed = dungeon.baseSeed + level * FLOOR_SEED_MULTIPLIER;

  const previousFloor = dungeon.floors.get(level - 1);
  const previousStairsDown = previousFloor?.stairsDown ?? null;

  const isLastFloorInDungeon = level === dungeon.maxFloors;

  const floorsPerRegion = getFloorsPerRegion(gameMode);
  const regionLevel = ((level - 1) % floorsPerRegion) + 1;

  const floor = generateFloor({
    level,
    regionLevel,
    floorsPerRegion,
    regionConfig,
    seed: floorSeed,
    previousStairsDown,
    isLastFloorInDungeon,
  });

  floor.visited = true;
  dungeon.floors.set(level, floor);

  if (level > dungeon.deepestReached) {
    dungeon.deepestReached = level;
  }

  spawnBossForFloor(floor);

  return floor;
}

export const useDungeonStore = create<DungeonStore>((set, get) => ({
  dungeon: null,
  isInDungeon: false,
  gameMode: 'normal',
  collapseEnabled: true,
  customSeed: null,

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode });
  },

  setCollapseEnabled: (enabled: boolean) => {
    set({ collapseEnabled: enabled });
  },

  setCustomSeed: (seed: number | null) => {
    set({ customSeed: seed });
  },

  getEffectiveSeed: (fallbackSeed: number) => {
    const { customSeed } = get();
    return customSeed ?? fallbackSeed;
  },

  enterDungeon: (seed: number) => {
    const { gameMode } = get();
    const maxFloors = getTotalFloors(gameMode);

    const dungeon: Dungeon = {
      id: `dungeon-${seed}`,
      name: 'Vainholm Depths',
      regions: REGION_CONFIGS,
      floors: new Map(),
      currentFloor: 1,
      deepestReached: 0,
      baseSeed: seed,
      maxFloors,
    };

    const firstFloor = generateFloorForLevel(dungeon, 1, gameMode);
    if (!firstFloor) {
      throw new Error('Failed to generate first floor');
    }

    set({
      dungeon,
      isInDungeon: true,
    });

    return firstFloor;
  },

  exitDungeon: () => {
    set({
      dungeon: null,
      isInDungeon: false,
    });
  },

  goToFloor: (level: number) => {
    const { dungeon, gameMode } = get();
    if (!dungeon) return null;

    if (level < 1 || level > dungeon.maxFloors) {
      return null;
    }

    const floor = generateFloorForLevel(dungeon, level, gameMode);
    if (!floor) return null;

    set({
      dungeon: {
        ...dungeon,
        currentFloor: level,
      },
    });

    return floor;
  },

  descendStairs: () => {
    const { dungeon, goToFloor, getCurrentFloor } = get();
    if (!dungeon) return null;

    const currentFloor = getCurrentFloor();
    if (!currentFloor || !currentFloor.stairsDown) return null;

    return goToFloor(dungeon.currentFloor + 1);
  },

  ascendStairs: (tick: number) => {
    const { dungeon, goToFloor, getCurrentFloor, isFloorCollapsed } = get();
    if (!dungeon) return null;

    const currentFloor = getCurrentFloor();
    if (!currentFloor || !currentFloor.stairsUp) return null;

    if (dungeon.currentFloor === 1) {
      return null;
    }

    const targetFloor = dungeon.currentFloor - 1;
    if (isFloorCollapsed(targetFloor, tick)) {
      return null;
    }

    return goToFloor(targetFloor);
  },

  getCurrentFloor: () => {
    const { dungeon } = get();
    if (!dungeon) return null;
    return dungeon.floors.get(dungeon.currentFloor) ?? null;
  },

  getFloor: (level: number) => {
    const { dungeon } = get();
    if (!dungeon) return null;
    return dungeon.floors.get(level) ?? null;
  },

  getCurrentRegion: () => {
    const { dungeon, gameMode } = get();
    if (!dungeon) return null;
    return getRegionConfigForFloor(dungeon.currentFloor, gameMode) ?? null;
  },

  getCollapsedFloor: (tick: number) => {
    const { collapseEnabled } = get();
    if (!collapseEnabled) return 0;
    return getCollapsedFloor(tick);
  },

  getTurnsUntilCollapse: (tick: number) => {
    const { dungeon, collapseEnabled } = get();
    if (!collapseEnabled || !dungeon) return null;
    return getTurnsUntilCollapse(tick, dungeon.currentFloor);
  },

  isFloorCollapsed: (floor: number, tick: number) => {
    const { collapseEnabled } = get();
    if (!collapseEnabled) return false;
    return floor <= getCollapsedFloor(tick);
  },

  checkCollapseGameOver: (tick: number) => {
    const { dungeon, collapseEnabled } = get();
    if (!collapseEnabled || !dungeon) return false;
    return isPlayerCaughtByCollapse(dungeon.currentFloor, tick);
  },
}));
