import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../stores/gameStore';
import { useViewport } from '../../hooks/useViewport';
import { useKeyboard } from '../../hooks/useKeyboard';
import { usePerformanceMetrics, useStatsOverlay } from '../../hooks/usePerformanceMetrics';
import { generateMapAsync, terminateWorker } from '../../utils/generateMapAsync';
import { clearColorNoiseCache } from '../../utils/colorNoiseCache';
import { PixiViewport } from './PixiViewport';
import { DebugInfo } from '../ui/DebugInfo';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../../utils/constants';
import styles from '../../styles/game.module.css';

export function GameContainer() {
  const { player, map, weather, timeOfDay, visibilityHash } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      map: state.map,
      weather: state.weather,
      timeOfDay: state.timeOfDay,
      visibilityHash: state.visibilityHash,
    }))
  );

  const debugMode = useGameStore((state) => state.debugMode);

  const setMap = useGameStore((state) => state.setMap);
  const movePlayer = useGameStore((state) => state.movePlayer);
  const toggleDebugMode = useGameStore((state) => state.toggleDebugMode);
  const getTileAt = useGameStore((state) => state.getTileAt);
  const isTileVisible = useGameStore((state) => state.isTileVisible);
  const isTileExplored = useGameStore((state) => state.isTileExplored);

  const { metrics, updateMetrics } = usePerformanceMetrics(debugMode);
  
  useStatsOverlay(debugMode);

  useEffect(() => {
    clearColorNoiseCache();
    generateMapAsync(MAP_WIDTH, MAP_HEIGHT, 42).then(setMap);
    return () => terminateWorker();
  }, [setMap]);

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
      movePlayer(dx, dy);
    },
    [movePlayer]
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
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const tileX = Math.floor(clickX / TILE_SIZE) + viewport.startX;
      const tileY = Math.floor(clickY / TILE_SIZE) + viewport.startY;
      
      const dx = tileX - player.position.x;
      const dy = tileY - player.position.y;

      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
        movePlayer(dx, dy);
      }
    },
    [player.position, movePlayer, viewport]
  );

  if (!map) {
    return (
      <div className={styles.gameContainer}>
        <p>Loading map...</p>
      </div>
    );
  }

  const currentTile = getTileAt(player.position.x, player.position.y);

  return (
    <div className={styles.gameContainer}>
      <div 
        className={styles.pixiWrapper}
        onClick={handleClick}
      >
        <PixiViewport
          map={map}
          playerPosition={player.position}
          playerFacing={player.facing}
          viewport={viewport}
          weather={weather}
          timeOfDay={timeOfDay}
          visibilityHash={visibilityHash}
          isTileVisible={isTileVisible}
          isTileExplored={isTileExplored}
        />
      </div>
      {debugMode && (
        <DebugInfo
          playerPosition={player.position}
          viewport={viewport}
          currentTile={currentTile}
          metrics={metrics}
        />
      )}
    </div>
  );
}
