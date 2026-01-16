import { create } from 'zustand';

import type { Direction, MapData, MapLayer, Position, TileType } from '../types';
import type { LightSource } from '../utils/lighting';
import type { TriggerEffect } from '../utils/tileInteractions';
import type {
  CombatStats,
  Enemy,
  EnemyId,
  TurnPhase,
  GameEndState,
  CombatLogEntry,
  CharacterClassId,
  BackgroundId,
  Weapon,
  StatusEffectId,
  StatusEffect,
} from '../combat/types';
import { getClass } from '../combat/classes';
import { getBackground } from '../combat/backgrounds';

import {
  combat_player_kill,
  combat_player_hit,
  combat_player_hit_critical,
} from '../paraglide/messages.js';
import { createLightSource, TILE_LIGHT_SOURCES, LIGHT_PRESETS } from '../utils/lighting';
import { TILE_DEFINITIONS } from '../utils/constants';
import { processTrigger } from '../utils/tileInteractions';
import { calculateDamage, applyDamageToEnemy } from '../combat/damageCalculation';
import { getLocalizedEnemyName } from '../utils/i18n';
import type { StatModifier } from '../progression/types';

function applyStatModifierToStats(
  stats: CombatStats,
  modifier: StatModifier
): CombatStats {
  switch (modifier.stat) {
    case 'maxHp': {
      const newMaxHp = Math.max(1, stats.maxHp + modifier.value);
      const nextHp = Math.min(newMaxHp, stats.hp + modifier.value);
      return { ...stats, maxHp: newMaxHp, hp: nextHp };
    }
    case 'hp': {
      const nextHp = Math.max(0, Math.min(stats.maxHp, stats.hp + modifier.value));
      return { ...stats, hp: nextHp };
    }
    case 'attack': {
      if (modifier.isPercentage) {
        const delta = Math.floor((stats.attack * modifier.value) / 100);
        return { ...stats, attack: stats.attack + delta };
      }
      return { ...stats, attack: stats.attack + modifier.value };
    }
    case 'defense': {
      if (modifier.isPercentage) {
        const delta = Math.floor((stats.defense * modifier.value) / 100);
        return { ...stats, defense: stats.defense + delta };
      }
      return { ...stats, defense: stats.defense + modifier.value };
    }
    case 'visionRange': {
      return stats;
    }
  }
}

const BASE_PLAYER_STATS: CombatStats = {
  hp: 30,
  maxHp: 30,
  attack: 8,
  defense: 2,
};

const calculateInitialStats = (
  classId: CharacterClassId,
  backgroundId: BackgroundId
): CombatStats => {
  const charClass = getClass(classId);
  const background = getBackground(backgroundId);
  
  let hp = BASE_PLAYER_STATS.hp + charClass.statModifiers.hp;
  const maxHp = hp;
  const attack = BASE_PLAYER_STATS.attack + charClass.statModifiers.attack;
  const defense = BASE_PLAYER_STATS.defense + charClass.statModifiers.defense;
  
  if (background.effect.type === 'bonus_hp') {
    hp += background.effect.amount;
  }
  
  return { hp, maxHp: maxHp + (background.effect.type === 'bonus_hp' ? background.effect.amount : 0), attack, defense };
};

let combatLogIdCounter = 0;

interface PlayerState {
  position: Position;
  facing: Direction;
  stats: CombatStats;
  classId: CharacterClassId;
  backgroundId: BackgroundId;
  weapon: Weapon | null;
  statusEffects: Map<StatusEffectId, StatusEffect>;
}

export type WeatherType = 'clear' | 'rain' | 'fog';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type MapType = 'world' | 'dungeon';

const VISION_RADIUS = 8;
const VISION_RADIUS_SQ = VISION_RADIUS * VISION_RADIUS;
const POS_KEY_MULTIPLIER = 100000;

const posKey = (x: number, y: number): number => y * POS_KEY_MULTIPLIER + x;

function getVisibleTiles(x: number, y: number): Set<number> {
  const visible = new Set<number>();
  for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
    for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
      if (dx * dx + dy * dy <= VISION_RADIUS_SQ) {
        visible.add(posKey(x + dx, y + dy));
      }
    }
  }
  return visible;
}

interface VisibilityDelta {
  toAdd: number[];
  toRemove: number[];
}

function getVisibilityDelta(
  oldX: number,
  oldY: number,
  newX: number,
  newY: number
): VisibilityDelta {
  const dx = newX - oldX;
  const dy = newY - oldY;

  if (dx === 0 && dy === 0) {
    return { toAdd: [], toRemove: [] };
  }

  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    const oldVisible = getVisibleTiles(oldX, oldY);
    const newVisible = getVisibleTiles(newX, newY);
    const toAdd: number[] = [];
    const toRemove: number[] = [];
    
    newVisible.forEach((key) => {
      if (!oldVisible.has(key)) toAdd.push(key);
    });
    oldVisible.forEach((key) => {
      if (!newVisible.has(key)) toRemove.push(key);
    });
    
    return { toAdd, toRemove };
  }

  const toAdd: number[] = [];
  const toRemove: number[] = [];

  // 1タイル移動時、新位置で見える範囲は旧位置から見ると最大 VISION_RADIUS+1 離れている
  // そのため、ループ範囲を拡張して端のタイルも正しく検出する
  const DELTA_RANGE = VISION_RADIUS + 1;

  for (let i = -DELTA_RANGE; i <= DELTA_RANGE; i++) {
    for (let j = -DELTA_RANGE; j <= DELTA_RANGE; j++) {
      const oldDistSq = i * i + j * j;
      const newI = i - dx;
      const newJ = j - dy;
      const newDistSq = newI * newI + newJ * newJ;

      const wasVisible = oldDistSq <= VISION_RADIUS_SQ;
      const isVisible = newDistSq <= VISION_RADIUS_SQ;

      if (isVisible && !wasVisible) {
        toAdd.push(posKey(newX + newI, newY + newJ));
      } else if (wasVisible && !isVisible) {
        toRemove.push(posKey(oldX + i, oldY + j));
      }
    }
  }

  return { toAdd, toRemove };
}

interface GameStore {
  player: PlayerState;
  map: MapData | null;
  terrainLayer: MapLayer | null;
  featureLayer: MapLayer | null;
  mapSeed: number;
  debugMode: boolean;
  tick: number;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  currentMapType: MapType;
  exploredTiles: Set<number>;
  visibleTiles: Set<number>;
  visibilityHash: number;
  lightSources: LightSource[];
  lastInteractionEffects: TriggerEffect[];
  worldMapCache: MapData | null;
  worldExploredTilesCache: Set<number> | null;
  dungeonEntrancePosition: Position | null;

  enemies: Map<EnemyId, Enemy>;
  turnPhase: TurnPhase;
  gameEndState: GameEndState;
  combatLog: CombatLogEntry[];

  setMap: (map: MapData, seed: number, entryPoint?: Position) => void;
  setMapType: (mapType: MapType) => void;
  movePlayer: (dx: number, dy: number) => void;
  setPlayerPosition: (position: Position) => void;
  toggleDebugMode: () => void;
  incrementTick: () => void;
  setWeather: (weather: WeatherType) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  canMoveTo: (x: number, y: number) => boolean;
  getTileAt: (x: number, y: number) => TileType | null;
  isTileVisible: (x: number, y: number) => boolean;
  isTileExplored: (x: number, y: number) => boolean;
  addLightSource: (light: LightSource) => void;
  removeLightSource: (id: string) => void;
  generateTileLights: () => void;
  clearInteractionEffects: () => void;
  cacheWorldMap: () => void;
  restoreWorldMap: () => Position | null;

  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: EnemyId) => void;
  updateEnemy: (id: EnemyId, updates: Partial<Enemy>) => void;
  getEnemyAt: (x: number, y: number) => Enemy | null;
  clearEnemies: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  setGameEndState: (state: GameEndState) => void;
  addCombatLogEntry: (entry: Omit<CombatLogEntry, 'id'>) => void;
  resetCombatState: () => void;
  applyStatModifiers: (modifiers: readonly StatModifier[]) => void;
}

const DEFAULT_CLASS_ID: CharacterClassId = 'warrior';
const DEFAULT_BACKGROUND_ID: BackgroundId = 'ex_soldier';

const createInitialPlayerState = (): PlayerState => ({
  position: { x: 50, y: 50 },
  facing: 'down',
  stats: calculateInitialStats(DEFAULT_CLASS_ID, DEFAULT_BACKGROUND_ID),
  classId: DEFAULT_CLASS_ID,
  backgroundId: DEFAULT_BACKGROUND_ID,
  weapon: null,
  statusEffects: new Map(),
});

export const useGameStore = create<GameStore>((set, get) => ({
  player: createInitialPlayerState(),
  map: null,
  terrainLayer: null,
  featureLayer: null,
  mapSeed: 0,
  debugMode: false,
  tick: 0,
  weather: 'clear',
  timeOfDay: 'day',
  currentMapType: 'world',
  exploredTiles: new Set<number>(),
  visibleTiles: new Set<number>(),
  visibilityHash: 0,
  lightSources: [],
  lastInteractionEffects: [],
  worldMapCache: null,
  worldExploredTilesCache: null,
  dungeonEntrancePosition: null,

  enemies: new Map<EnemyId, Enemy>(),
  turnPhase: 'player',
  gameEndState: 'playing',
  combatLog: [],

  setMap: (map, seed, entryPoint) => {
    const terrainLayer = map.layers.find((l) => l.name === 'terrain') ?? null;
    const featureLayer = map.layers.find((l) => l.name === 'features') ?? null;
    const spawnAt = entryPoint ?? map.spawnPoint;
    const spawnVisible = getVisibleTiles(spawnAt.x, spawnAt.y);
    set({
      map,
      terrainLayer,
      featureLayer,
      mapSeed: seed,
      player: {
        ...get().player,
        position: { ...spawnAt },
        facing: 'down',
      },
      visibleTiles: spawnVisible,
      exploredTiles: new Set(spawnVisible),
      visibilityHash: spawnAt.x * 10000 + spawnAt.y,
    });
  },

  setMapType: (mapType) => {
    set({ currentMapType: mapType });
  },

  movePlayer: (dx, dy) => {
    const state = get();
    const { player, canMoveTo, exploredTiles, visibleTiles, getEnemyAt, gameEndState } = state;
    
    if (gameEndState !== 'playing') return;
    
    const oldX = player.position.x;
    const oldY = player.position.y;
    const newX = oldX + dx;
    const newY = oldY + dy;

    const enemy = getEnemyAt(newX, newY);
    if (enemy) {
      const damageResult = calculateDamage(player.stats, enemy.stats);
      const { newHp, isDead } = applyDamageToEnemy(enemy.stats.hp, damageResult.damage);
      
      state.updateEnemy(enemy.id, {
        stats: { ...enemy.stats, hp: newHp },
        isAlive: !isDead,
      });
      
      const enemyName = getLocalizedEnemyName(enemy.type);
      const message = isDead
        ? combat_player_kill({ enemy: enemyName })
        : damageResult.isCritical
          ? combat_player_hit_critical({ enemy: enemyName, damage: damageResult.damage })
          : combat_player_hit({ enemy: enemyName, damage: damageResult.damage });
      
      state.addCombatLogEntry({
        tick: state.tick,
        type: isDead ? 'enemy_death' : 'player_attack',
        message,
        damage: damageResult.damage,
      });
      
      if (isDead) {
        state.removeEnemy(enemy.id);
      }
      
      return;
    }

    if (canMoveTo(newX, newY)) {
      let facing: Direction = player.facing;
      if (dy < 0) facing = 'up';
      else if (dy > 0) facing = 'down';
      else if (dx < 0) facing = 'left';
      else if (dx > 0) facing = 'right';

      const delta = getVisibilityDelta(oldX, oldY, newX, newY);
      
      const newVisibleTiles = new Set(visibleTiles);
      const newExploredTiles = new Set(exploredTiles);

      for (const key of delta.toRemove) {
        newVisibleTiles.delete(key);
      }
      for (const key of delta.toAdd) {
        newVisibleTiles.add(key);
        newExploredTiles.add(key);
      }

      const tileType = get().getTileAt(newX, newY);
      let interactionEffects: TriggerEffect[] = [];
      
      if (tileType) {
        const result = processTrigger(
          { x: newX, y: newY },
          tileType,
          'player_step'
        );
        if (result) {
          interactionEffects = result.effects;
        }
      }

      set({
        player: {
          ...player,
          position: { x: newX, y: newY },
          facing,
        },
        visibleTiles: newVisibleTiles,
        exploredTiles: newExploredTiles,
        visibilityHash: newX * 10000 + newY,
        lastInteractionEffects: interactionEffects,
      });
    }
  },

  setPlayerPosition: (position) => {
    set((state) => ({
      player: { ...state.player, position },
    }));
  },

  toggleDebugMode: () => {
    set((state) => ({ debugMode: !state.debugMode }));
  },

  incrementTick: () => {
    set((state) => ({ tick: state.tick + 1 }));
  },

  setWeather: (weather) => {
    set({ weather });
  },

  setTimeOfDay: (timeOfDay) => {
    set({ timeOfDay });
  },

  canMoveTo: (x, y) => {
    const { map } = get();
    if (!map) return false;

    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return false;
    }

    const tileType = get().getTileAt(x, y);
    if (!tileType) return false;

    return TILE_DEFINITIONS[tileType].walkable;
  },

  getTileAt: (x, y) => {
    const { map, terrainLayer, featureLayer } = get();
    if (!map || !terrainLayer) return null;

    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return null;
    }

    if (featureLayer) {
      const featureId = featureLayer.data[y]?.[x];
      if (featureId !== undefined && featureId !== 0) {
        return map.tileMapping[String(featureId)] || null;
      }
    }

    const tileId = terrainLayer.data[y]?.[x];
    if (tileId === undefined) return null;

    return map.tileMapping[String(tileId)] || null;
  },

  isTileVisible: (x, y) => {
    const { visibleTiles } = get();
    return visibleTiles.has(posKey(x, y));
  },

  isTileExplored: (x, y) => {
    const { exploredTiles } = get();
    return exploredTiles.has(posKey(x, y));
  },

  addLightSource: (light) => {
    set((state) => ({
      lightSources: [...state.lightSources, light],
    }));
  },

  removeLightSource: (id) => {
    set((state) => ({
      lightSources: state.lightSources.filter((l) => l.id !== id),
    }));
  },

  generateTileLights: () => {
    const { map, terrainLayer, featureLayer } = get();
    if (!map || !terrainLayer) return;

    const tileLights: LightSource[] = [];
    
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        let tileType: TileType | undefined;
        
        if (featureLayer) {
          const featureId = featureLayer.data[y]?.[x];
          if (featureId !== undefined && featureId !== 0) {
            tileType = map.tileMapping[String(featureId)] as TileType | undefined;
          }
        }
        
        if (!tileType) {
          const tileId = terrainLayer.data[y]?.[x];
          if (tileId !== undefined) {
            tileType = map.tileMapping[String(tileId)] as TileType | undefined;
          }
        }
        
        if (!tileType) continue;
        
        const presetKey = TILE_LIGHT_SOURCES[tileType];
        if (presetKey && LIGHT_PRESETS[presetKey]) {
          tileLights.push(
            createLightSource(`tile-${x}-${y}`, { x, y }, presetKey)
          );
        }
      }
    }
    
    set({ lightSources: tileLights });
  },

  clearInteractionEffects: () => {
    set({ lastInteractionEffects: [] });
  },

  cacheWorldMap: () => {
    const { map, exploredTiles } = get();
    if (map) {
      set({
        worldMapCache: map,
        worldExploredTilesCache: new Set(exploredTiles),
        dungeonEntrancePosition: map.dungeonEntrance ?? null,
      });
    }
  },

  restoreWorldMap: () => {
    const { worldMapCache, worldExploredTilesCache, dungeonEntrancePosition, mapSeed, player } = get();
    if (!worldMapCache) return null;

    const terrainLayer = worldMapCache.layers.find((l) => l.name === 'terrain') ?? null;
    const featureLayer = worldMapCache.layers.find((l) => l.name === 'features') ?? null;
    const returnPosition = dungeonEntrancePosition ?? worldMapCache.spawnPoint;
    const returnVisible = getVisibleTiles(returnPosition.x, returnPosition.y);

    const restoredExplored = worldExploredTilesCache
      ? new Set([...worldExploredTilesCache, ...returnVisible])
      : new Set(returnVisible);

    set({
      map: worldMapCache,
      terrainLayer,
      featureLayer,
      mapSeed,
      player: { ...player, position: { ...returnPosition }, facing: 'down' },
      visibleTiles: returnVisible,
      exploredTiles: restoredExplored,
      visibilityHash: returnPosition.x * 10000 + returnPosition.y,
      worldMapCache: null,
      worldExploredTilesCache: null,
    });

    return returnPosition;
  },

  addEnemy: (enemy) => {
    set((state) => {
      const newEnemies = new Map(state.enemies);
      newEnemies.set(enemy.id, enemy);
      return { enemies: newEnemies };
    });
  },

  removeEnemy: (id) => {
    set((state) => {
      const newEnemies = new Map(state.enemies);
      newEnemies.delete(id);
      return { enemies: newEnemies };
    });
  },

  updateEnemy: (id, updates) => {
    set((state) => {
      const enemy = state.enemies.get(id);
      if (!enemy) return state;
      const newEnemies = new Map(state.enemies);
      newEnemies.set(id, { ...enemy, ...updates });
      return { enemies: newEnemies };
    });
  },

  getEnemyAt: (x, y) => {
    const { enemies } = get();
    for (const enemy of enemies.values()) {
      if (enemy.isAlive && enemy.position.x === x && enemy.position.y === y) {
        return enemy;
      }
    }
    return null;
  },

  clearEnemies: () => {
    set({ enemies: new Map() });
  },

  damagePlayer: (amount) => {
    set((state) => {
      const newHp = Math.max(0, state.player.stats.hp - amount);
      const newGameEndState = newHp <= 0 ? 'defeat' : state.gameEndState;
      return {
        player: {
          ...state.player,
          stats: { ...state.player.stats, hp: newHp },
        },
        gameEndState: newGameEndState,
      };
    });
  },

  healPlayer: (amount) => {
    set((state) => ({
      player: {
        ...state.player,
        stats: {
          ...state.player.stats,
          hp: Math.min(state.player.stats.maxHp, state.player.stats.hp + amount),
        },
      },
    }));
  },

  setTurnPhase: (phase) => {
    set({ turnPhase: phase });
  },

  setGameEndState: (state) => {
    set({ gameEndState: state });
  },

  addCombatLogEntry: (entry) => {
    const entryWithId: CombatLogEntry = {
      ...entry,
      id: `log-${++combatLogIdCounter}`,
    };
    set((state) => ({
      combatLog: [...state.combatLog.slice(-49), entryWithId],
    }));
  },

  resetCombatState: () => {
    combatLogIdCounter = 0;
    const currentPlayer = get().player;
    set({
      player: {
        ...currentPlayer,
        stats: calculateInitialStats(currentPlayer.classId, currentPlayer.backgroundId),
        statusEffects: new Map(),
      },
      enemies: new Map(),
      turnPhase: 'player',
      gameEndState: 'playing',
      combatLog: [],
    });
  },

  applyStatModifiers: (modifiers) => {
    set((state) => {
      let nextStats = state.player.stats;
      for (const modifier of modifiers) {
        nextStats = applyStatModifierToStats(nextStats, modifier);
      }

      const nextHp = Math.max(0, Math.min(nextStats.maxHp, nextStats.hp));

      return {
        player: {
          ...state.player,
          stats: {
            ...nextStats,
            hp: nextHp,
          },
        },
      };
    });
  },
}));
