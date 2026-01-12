import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../stores/gameStore';
import { useDungeonStore } from '../dungeon';

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
    setMap,
    setMapType,
    clearInteractionEffects,
    generateTileLights,
    cacheWorldMap,
    restoreWorldMap,
  } = useGameStore(
    useShallow((state) => ({
      lastInteractionEffects: state.lastInteractionEffects,
      mapSeed: state.mapSeed,
      currentMapType: state.currentMapType,
      setMap: state.setMap,
      setMapType: state.setMapType,
      clearInteractionEffects: state.clearInteractionEffects,
      generateTileLights: state.generateTileLights,
      cacheWorldMap: state.cacheWorldMap,
      restoreWorldMap: state.restoreWorldMap,
    }))
  );

  const { isInDungeon, enterDungeon, exitDungeon, descendStairs, ascendStairs } = useDungeonStore(
    useShallow((state) => ({
      isInDungeon: state.isInDungeon,
      enterDungeon: state.enterDungeon,
      exitDungeon: state.exitDungeon,
      descendStairs: state.descendStairs,
      ascendStairs: state.ascendStairs,
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
        const firstFloor = enterDungeon(mapSeed);
        setMap(firstFloor.map, mapSeed, firstFloor.stairsUp ?? undefined);
        setMapType('dungeon');
        generateTileLights();
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
        const newFloor = descendStairs();
        if (newFloor) {
          const entryPoint = newFloor.stairsUp ?? undefined;
          setMap(newFloor.map, mapSeed, entryPoint);
          generateTileLights();
          onFloorChange?.();
        }
      } else if (effect.type === 'ascend' && isInDungeon) {
        const newFloor = ascendStairs();
        if (newFloor) {
          const entryPoint = newFloor.stairsDown ?? undefined;
          setMap(newFloor.map, mapSeed, entryPoint);
          generateTileLights();
          onFloorChange?.();
        }
      }
      // TODO: Handle 'message' effects when message UI system is implemented
    }

    clearInteractionEffects();
  }, [
    lastInteractionEffects,
    currentMapType,
    isInDungeon,
    enterDungeon,
    exitDungeon,
    descendStairs,
    ascendStairs,
    setMap,
    setMapType,
    mapSeed,
    generateTileLights,
    clearInteractionEffects,
    cacheWorldMap,
    restoreWorldMap,
    onFloorChange,
    onEnterDungeon,
    onExitDungeon,
  ]);
}
