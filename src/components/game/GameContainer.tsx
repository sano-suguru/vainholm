import { useEffect, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../stores/gameStore';
import { useDungeonStore } from '../../dungeon';
import { useProgressionStore } from '../../progression';
import { useViewport } from '../../hooks/useViewport';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useEffectProcessor } from '../../hooks/useEffectProcessor';
import { usePerformanceMetrics, useStatsOverlay } from '../../hooks/usePerformanceMetrics';
import { generateMapAsync, terminateWorker } from '../../utils/generateMapAsync';
import { clearColorNoiseCache } from '../../utils/colorNoiseCache';
import { getMapSeed, updateUrlWithSeed } from '../../utils/seedUtils';
import { lazy } from 'react';

const PixiViewport = lazy(async () => {
  const mod = await import('./PixiViewport');
  return { default: mod.PixiViewport };
});
import { DebugInfo } from '../ui/DebugInfo';
import { GameOverScreen } from '../ui/GameOverScreen';
import { LevelUpScreen } from '../ui/LevelUpScreen';
import { Hud } from '../ui/hud';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../../utils/constants';
import { executeTurn } from '../../combat/turnManager';
import type { Enemy } from '../../combat/types';
import styles from '../../styles/game.module.css';

export function GameContainer() {
  const { player, map, weather, timeOfDay, visibilityHash, lightSources, mapSeed, enemies, gameEndState, currentBoss, bossDefeatedOnFloor } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      map: state.map,
      weather: state.weather,
      timeOfDay: state.timeOfDay,
      visibilityHash: state.visibilityHash,
      lightSources: state.lightSources,
      mapSeed: state.mapSeed,
      enemies: state.enemies,
      gameEndState: state.gameEndState,
      currentBoss: state.currentBoss,
      bossDefeatedOnFloor: state.bossDefeatedOnFloor,
    }))
  );

  const { debugMode } = useGameStore(
    useShallow((state) => ({
      debugMode: state.debugMode,
    }))
  );
  
  const setMap = useGameStore((state) => state.setMap);
  const setMapType = useGameStore((state) => state.setMapType);
  const movePlayer = useGameStore((state) => state.movePlayer);
  const toggleDebugMode = useGameStore((state) => state.toggleDebugMode);
  const getTileAt = useGameStore((state) => state.getTileAt);
  const isTileVisible = useGameStore((state) => state.isTileVisible);
  const isTileExplored = useGameStore((state) => state.isTileExplored);
  const generateTileLights = useGameStore((state) => state.generateTileLights);

  const isInDungeon = useDungeonStore((state) => state.isInDungeon);
  const dungeon = useDungeonStore((state) => state.dungeon);

  const {
    pendingLevelUp,
    currentChoices,
    checkLevelUp,
    triggerLevelUp,
    selectUpgrade,
  } = useProgressionStore(
    useShallow((state) => ({
      pendingLevelUp: state.pendingLevelUp,
      currentChoices: state.currentChoices,
      checkLevelUp: state.checkLevelUp,
      triggerLevelUp: state.triggerLevelUp,
      selectUpgrade: state.selectUpgrade,
    }))
  );
  
  const currentFloor = useMemo(() => {
    if (!dungeon) return null;
    return dungeon.floors.get(dungeon.currentFloor) ?? null;
  }, [dungeon]);

  const { metrics, updateMetrics } = usePerformanceMetrics(debugMode);
  
  useStatsOverlay(debugMode);

  useEffect(() => {
    clearColorNoiseCache();
    const seed = getMapSeed();
    updateUrlWithSeed(seed);

    setMapType('world');
    generateMapAsync(MAP_WIDTH, MAP_HEIGHT, seed).then((mapData) => {
      setMap(mapData, seed);
      generateTileLights();
    });

    return () => terminateWorker();
  }, [setMap, setMapType, generateTileLights]);

  useEffectProcessor();

  useEffect(() => {
    let animationId: number;

    const updateFrame = () => {
      updateMetrics();
      animationId = requestAnimationFrame(updateFrame);
    };

    animationId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animationId);
  }, [updateMetrics]);

  const handleMove = useCallback(
    (dx: number, dy: number) => {
      if (gameEndState !== 'playing') return;
      if (pendingLevelUp) return;
      movePlayer(dx, dy);
      if (isInDungeon) {
        executeTurn();
      }
    },
    [movePlayer, isInDungeon, gameEndState, pendingLevelUp]
  );

  useEffect(() => {
    if (isInDungeon && dungeon && checkLevelUp(dungeon.currentFloor)) {
      triggerLevelUp(dungeon.currentFloor);
    }
  }, [isInDungeon, dungeon?.currentFloor, checkLevelUp, triggerLevelUp, dungeon]);

  useEffect(() => {
    if (bossDefeatedOnFloor && isInDungeon && dungeon && !pendingLevelUp) {
      triggerLevelUp(dungeon.currentFloor);
    }
  }, [bossDefeatedOnFloor, isInDungeon, dungeon, pendingLevelUp, triggerLevelUp]);

  const handleUpgradeSelect = useCallback(
    (upgradeId: string) => {
      selectUpgrade(upgradeId);
    },
    [selectUpgrade]
  );

  useKeyboard({
    onMove: handleMove,
    onDebugToggle: toggleDebugMode,
  });

  const viewport = useViewport(
    player.position,
    map?.width || MAP_WIDTH,
    map?.height || MAP_HEIGHT
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (gameEndState !== 'playing') return;
      if (pendingLevelUp) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const tileX = Math.floor(clickX / TILE_SIZE) + viewport.startX;
      const tileY = Math.floor(clickY / TILE_SIZE) + viewport.startY;
      
      const dx = tileX - player.position.x;
      const dy = tileY - player.position.y;

      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
        movePlayer(dx, dy);
        if (isInDungeon) {
          executeTurn();
        }
      }
    },
    [player.position, movePlayer, viewport, gameEndState, pendingLevelUp, isInDungeon]
  );

  const currentTile = useMemo(
    () => map ? getTileAt(player.position.x, player.position.y) : null,
    [map, getTileAt, player.position.x, player.position.y]
  );
  
  const floorInfo = useMemo(
    () => isInDungeon && currentFloor 
      ? `${currentFloor.map.name} (${currentFloor.level}F)`
      : undefined,
    [isInDungeon, currentFloor]
  );

  const enemiesArray = useMemo(
    () => Array.from(enemies.values()).filter((e): e is Enemy => e.isAlive),
    [enemies]
  );
  
  const playerStats = useMemo(
    () => ({ hp: player.stats.hp, maxHp: player.stats.maxHp }),
    [player.stats.hp, player.stats.maxHp]
  );

  if (!map) {
    return (
      <div className={styles.gameContainer}>
        <p>Loading map...</p>
      </div>
    );
  }

  if (gameEndState === 'defeat') {
    return <GameOverScreen type="defeat" />;
  }

  if (gameEndState === 'victory') {
    return <GameOverScreen type="victory" />;
  }

  return (
    <div className={styles.gameContainer}>
      <div 
        className={styles.pixiWrapper}
        onClick={handleClick}
      >
        <PixiViewport
          map={map}
          playerPosition={player.position}
          viewport={viewport}
          weather={weather}
          timeOfDay={timeOfDay}
          visibilityHash={visibilityHash}
          isTileVisible={isTileVisible}
          isTileExplored={isTileExplored}
          lightSources={lightSources}
          multiTileObjects={currentFloor?.multiTileObjects}
          enemies={enemiesArray}
          playerStats={playerStats}
          currentBoss={currentBoss}
        />
      </div>
      <Hud />
      {debugMode && (
        <DebugInfo
          playerPosition={player.position}
          viewport={viewport}
          currentTile={currentTile}
          metrics={metrics}
          mapSeed={mapSeed}
          floorInfo={floorInfo}
        />
      )}
      {pendingLevelUp && currentChoices && dungeon && (
        <LevelUpScreen
          choices={currentChoices}
          onSelect={handleUpgradeSelect}
          floor={dungeon.currentFloor}
        />
      )}
    </div>
  );
}
