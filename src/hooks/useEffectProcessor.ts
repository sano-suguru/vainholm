import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../stores/gameStore';
import { useDungeonStore } from '../dungeon';
import type { DungeonFloor } from '../dungeon/types';
import { getRegionConfigForFloor } from '../dungeon/config';
import { spawnEnemiesForFloor, resetEnemyIdCounter } from '../combat/enemySpawner';
import type { Position } from '../types';
import { TILE_DEFINITIONS } from '../utils/constants';
import type { TileType } from '../types';
import { getRemnantForRegion } from '../progression/remnants';
import { useMetaProgressionStore } from '../stores/metaProgressionStore';

const getWalkableTilesFromFloor = (floor: DungeonFloor): Position[] => {
  const walkableTiles: Position[] = [];
  const map = floor.map;
  const terrainLayer = map.layers.find((l) => l.name === 'terrain');
  if (!terrainLayer) return walkableTiles;

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileId = terrainLayer.data[y]?.[x];
      if (tileId === undefined) continue;
      
      const tileType = map.tileMapping[String(tileId)] as TileType | undefined;
      if (tileType && TILE_DEFINITIONS[tileType]?.walkable) {
        walkableTiles.push({ x, y });
      }
    }
  }
  return walkableTiles;
};

const spawnEnemiesOnFloor = (floor: DungeonFloor, playerSpawn: Position): void => {
  const walkableTiles = getWalkableTilesFromFloor(floor);
  spawnEnemiesForFloor(floor.level, walkableTiles, playerSpawn);
};

interface UseEffectProcessorOptions {
  onFloorChange?: () => void;
  onEnterDungeon?: () => void;
  onExitDungeon?: () => void;
}

export function useEffectProcessor(options: UseEffectProcessorOptions = {}) {
  const { onFloorChange, onEnterDungeon, onExitDungeon } = options;

  const {
    lastInteractionEffects,
    mapSeed,
    currentMapType,
    tick,
    setMap,
    setMapType,
    clearInteractionEffects,
    generateTileLights,
    cacheWorldMap,
    restoreWorldMap,
    setGameEndState,
    openRemnantTrade,
  } = useGameStore(
    useShallow((state) => ({
      lastInteractionEffects: state.lastInteractionEffects,
      mapSeed: state.mapSeed,
      currentMapType: state.currentMapType,
      tick: state.tick,
      setMap: state.setMap,
      setMapType: state.setMapType,
      clearInteractionEffects: state.clearInteractionEffects,
      generateTileLights: state.generateTileLights,
      cacheWorldMap: state.cacheWorldMap,
      restoreWorldMap: state.restoreWorldMap,
      setGameEndState: state.setGameEndState,
      openRemnantTrade: state.openRemnantTrade,
    }))
  );

  const { isInDungeon, dungeon, gameMode, enterDungeon, exitDungeon, descendStairs, ascendStairs, getCurrentFloor } = useDungeonStore(
    useShallow((state) => ({
      isInDungeon: state.isInDungeon,
      dungeon: state.dungeon,
      gameMode: state.gameMode,
      enterDungeon: state.enterDungeon,
      exitDungeon: state.exitDungeon,
      descendStairs: state.descendStairs,
      ascendStairs: state.ascendStairs,
      getCurrentFloor: state.getCurrentFloor,
    }))
  );

  useEffect(() => {
    if (lastInteractionEffects.length === 0) return;

    const isDungeonMode = currentMapType === 'dungeon';
    const applicableEffects = isDungeonMode
      ? lastInteractionEffects
      : lastInteractionEffects.filter(
          (e) => e.type !== 'descend' && e.type !== 'ascend'
        );

    for (const effect of applicableEffects) {
      if (effect.type === 'enter_dungeon' && !isInDungeon) {
        cacheWorldMap();
        resetEnemyIdCounter();
        const firstFloor = enterDungeon(mapSeed);
        const playerSpawn = firstFloor.stairsUp ?? firstFloor.map.spawnPoint;
        setMap(firstFloor.map, mapSeed, playerSpawn);
        setMapType('dungeon');
        generateTileLights();
        spawnEnemiesOnFloor(firstFloor, playerSpawn);
        onEnterDungeon?.();
      } else if (effect.type === 'exit_dungeon' && isInDungeon) {
        exitDungeon();
        const returnPosition = restoreWorldMap();
        if (returnPosition) {
          setMapType('world');
          generateTileLights();
          onExitDungeon?.();
        }
      } else if (effect.type === 'descend' && isInDungeon) {
        const currentFloor = getCurrentFloor();
        if (currentFloor && dungeon && currentFloor.level >= dungeon.maxFloors) {
          setGameEndState('victory');
        } else {
          const newFloor = descendStairs();
          if (newFloor) {
            useGameStore.getState().clearFloorStatModifiers();
            useGameStore.getState().clearFloorPenalties();
            const entryPoint = newFloor.stairsUp ?? newFloor.map.spawnPoint;
            setMap(newFloor.map, mapSeed, entryPoint);
            generateTileLights();
            spawnEnemiesOnFloor(newFloor, entryPoint);
            onFloorChange?.();
          }
        }
      } else if (effect.type === 'ascend' && isInDungeon) {
        const newFloor = ascendStairs(tick);
        if (newFloor) {
          useGameStore.getState().clearFloorStatModifiers();
          useGameStore.getState().clearFloorPenalties();
          const entryPoint = newFloor.stairsDown ?? newFloor.map.spawnPoint;
          setMap(newFloor.map, mapSeed, entryPoint);
          generateTileLights();
          spawnEnemiesOnFloor(newFloor, entryPoint);
          onFloorChange?.();
        }
      } else if (effect.type === 'open_remnant_trade') {
        if (!dungeon) continue;
        const regionConfig = getRegionConfigForFloor(dungeon.currentFloor, gameMode);
        if (!regionConfig) continue;
        const remnantRegion = ['hrodrgraf', 'rotmyrkr', 'gleymdariki', 'upphafsdjup'].includes(regionConfig.theme)
          ? (regionConfig.theme as 'hrodrgraf' | 'rotmyrkr' | 'gleymdariki' | 'upphafsdjup')
          : null;
        if (!remnantRegion) {
          continue;
        }
        const remnant = getRemnantForRegion(remnantRegion);
        if (!remnant) continue;
        if (useMetaProgressionStore.getState().hasTradeWithRemnant(remnant.id)) continue;
        openRemnantTrade();
      }

      // TODO: Handle 'message' effects when message UI system is implemented
    }

    clearInteractionEffects();
  }, [
    lastInteractionEffects,
    currentMapType,
    isInDungeon,
    dungeon,
    enterDungeon,
    exitDungeon,
    descendStairs,
    ascendStairs,
    getCurrentFloor,
    setMap,
    setMapType,
    mapSeed,
    generateTileLights,
    clearInteractionEffects,
    cacheWorldMap,
    restoreWorldMap,
    setGameEndState,
    openRemnantTrade,
    onFloorChange,
    onEnterDungeon,
    onExitDungeon,
    gameMode,
    tick,
  ]);
}
