import { useEffect, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../stores/gameStore';
import { useMetaProgressionStore } from '../../stores/metaProgressionStore';
import { useDungeonStore } from '../../dungeon';
import { useProgressionStore } from '../../progression';
import { useInventoryStore } from '../../items/inventoryStore';
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
import { WeaponDropModal } from '../ui/WeaponDropModal';
import { RemnantTradeModal } from '../ui/RemnantTradeModal';
import { Hud } from '../ui/hud';
import { getRegionConfigForFloor } from '../../dungeon/config';
import { getRemnantForRegion } from '../../progression/remnants';
import type { RemnantTrade, RemnantCost, RemnantBenefit } from '../../progression/remnants';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../../utils/constants';
import { executeTurn } from '../../combat/turnManager';
import type { Enemy } from '../../combat/types';
import styles from '../../styles/game.module.css';

interface GameContainerProps {
  onReturnToTitle: () => void;
}

export function GameContainer({ onReturnToTitle }: GameContainerProps) {
  const { player, map, weather, timeOfDay, visibilityHash, lightSources, mapSeed, enemies, gameEndState, currentBoss, bossDefeatedOnFloor, pendingWeaponDrop, pendingRemnantTrade } = useGameStore(
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
      pendingWeaponDrop: state.pendingWeaponDrop,
      pendingRemnantTrade: state.pendingRemnantTrade,
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
  const equipWeapon = useGameStore((state) => state.equipWeapon);
  const discardWeaponDrop = useGameStore((state) => state.discardWeaponDrop);
  const closeRemnantTrade = useGameStore((state) => state.closeRemnantTrade);
  const healPlayer = useGameStore((state) => state.healPlayer);
  const applyStatModifiers = useGameStore((state) => state.applyStatModifiers);
  const addFloorStatModifiers = useGameStore((state) => state.addFloorStatModifiers);
  const addVisionPenalty = useGameStore((state) => state.addVisionPenalty);
  const revealAllTiles = useGameStore((state) => state.revealAllTiles);
  const revealTrapTiles = useGameStore((state) => state.revealTrapTiles);
  const setInvulnerable = useGameStore((state) => state.setInvulnerable);
  const addStatusEffect = useGameStore((state) => state.addStatusEffect);

  const isInDungeon = useDungeonStore((state) => state.isInDungeon);
  const dungeon = useDungeonStore((state) => state.dungeon);
  const gameMode = useDungeonStore((state) => state.gameMode);

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

  const currentRemnant = useMemo(() => {
    if (!dungeon) return null;
    const regionConfig = getRegionConfigForFloor(dungeon.currentFloor, gameMode);
    if (!regionConfig) return null;
    const theme = regionConfig.theme as 'hrodrgraf' | 'rotmyrkr' | 'gleymdariki' | 'upphafsdjup';
    if (!['hrodrgraf', 'rotmyrkr', 'gleymdariki', 'upphafsdjup'].includes(theme)) return null;
    return getRemnantForRegion(theme);
  }, [dungeon, gameMode]);

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

  const applyRemnantBenefit = useCallback(
    (benefit: RemnantBenefit) => {
      switch (benefit.type) {
        case 'full_heal':
          healPlayer(player.stats.maxHp);
          break;
        case 'stat_buff':
          if (benefit.duration === -1) {
            addFloorStatModifiers([{ stat: benefit.stat, value: benefit.amount }]);
          } else {
            applyStatModifiers([{ stat: benefit.stat, value: benefit.amount }]);
          }
          break;
        case 'reveal_next_region':
          revealAllTiles();
          break;
        case 'reveal_traps':
          revealTrapTiles();
          break;
        case 'temporary_invulnerability':
          setInvulnerable(benefit.turns);
          break;
        case 'grant_relic':
          useMetaProgressionStore.getState().discoverRelic(benefit.relicId);
          break;
        default:
          break;
      }
    },
    [healPlayer, applyStatModifiers, player.stats.maxHp, revealAllTiles, revealTrapTiles, setInvulnerable, addFloorStatModifiers]
  );

  const applyRemnantCost = useCallback(
    (cost: RemnantCost) => {
      switch (cost.type) {
        case 'hp_damage':
          // Bypasses invulnerability: trade costs are sacrifices, not combat damage
          applyStatModifiers([{ stat: 'hp', value: -cost.amount }]);
          break;
        case 'max_hp_reduction':
          applyStatModifiers([{ stat: 'maxHp', value: -cost.amount }]);
          break;
        case 'vision_reduction':
          addVisionPenalty(cost.amount, cost.permanent);
          break;
        case 'movement_penalty':
          addStatusEffect({
            id: 'slow',
            duration: cost.turns,
            stacks: 1,
            source: 'self',
          });
          break;
        case 'random_stat_loss': {
          const stats: Array<'attack' | 'defense' | 'maxHp'> = ['attack', 'defense', 'maxHp'];
          const selected = stats[Math.floor(Math.random() * stats.length)];
          applyStatModifiers([{ stat: selected, value: -cost.amount }]);
          break;
        }
        default:
          break;
      }
    },
    [applyStatModifiers, addVisionPenalty, addStatusEffect]
  );

  const handleAcceptTrade = useCallback(
    (trade: RemnantTrade) => {
      applyRemnantBenefit(trade.benefit);
      applyRemnantCost(trade.cost);
      if (currentRemnant && dungeon) {
        if (!useMetaProgressionStore.getState().hasTradeWithRemnant(currentRemnant.id)) {
          useMetaProgressionStore.getState().recordRemnantTrade(
            currentRemnant.id,
            trade.id,
            dungeon.currentFloor
          );
        }
      }
      closeRemnantTrade();
    },
    [applyRemnantBenefit, applyRemnantCost, closeRemnantTrade, currentRemnant, dungeon]
  );

  const handleDeclineTrade = useCallback(() => {
    closeRemnantTrade();
  }, [closeRemnantTrade]);

  const handleQuickbarUse = useCallback((slotIndex: number) => {
    if (gameEndState !== 'playing') return;
    if (pendingLevelUp) return;
    useInventoryStore.getState().useItem(slotIndex);
  }, [gameEndState, pendingLevelUp]);

  useKeyboard({
    onMove: handleMove,
    onDebugToggle: toggleDebugMode,
    onQuickbarUse: handleQuickbarUse,
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
    return <GameOverScreen type="defeat" onNewGame={onReturnToTitle} />;
  }

  if (gameEndState === 'victory') {
    return <GameOverScreen type="victory" onNewGame={onReturnToTitle} />;
  }

  if (gameEndState === 'victory_true') {
    return <GameOverScreen type="victory_true" onNewGame={onReturnToTitle} />;
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
      {pendingWeaponDrop && (
        <WeaponDropModal
          weapon={pendingWeaponDrop}
          currentWeapon={player.weapon}
          onEquip={() => equipWeapon(pendingWeaponDrop)}
          onDiscard={discardWeaponDrop}
        />
      )}
      {pendingRemnantTrade && currentRemnant && (
        <RemnantTradeModal
          remnant={currentRemnant}
          onAcceptTrade={handleAcceptTrade}
          onDecline={handleDeclineTrade}
        />
      )}
    </div>
  );
}
