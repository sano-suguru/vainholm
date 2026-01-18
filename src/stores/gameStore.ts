import { create } from 'zustand';

import type { Direction, MapData, MapLayer, Position, TileType } from '../types';
import type { LightSource } from '../utils/lighting';
import type { TriggerEffect } from '../utils/tileInteractions';
import type {
  CombatStats,
  Enemy,
  EnemyId,
  Boss,
  TurnPhase,
  GameEndState,
  CombatLogEntry,
  CharacterClassId,
  BackgroundId,
  Weapon,
  Armor,
  StatusEffectId,
  StatusEffect,
} from '../combat/types';
import { getClass } from '../combat/classes';
import { getBackground } from '../combat/backgrounds';

import {
  combat_player_kill,
  combat_player_hit,
  combat_player_hit_critical,
  combat_player_stealth_attack,
} from '../paraglide/messages.js';
import { createLightSource, TILE_LIGHT_SOURCES, LIGHT_PRESETS } from '../utils/lighting';
import { TILE_DEFINITIONS } from '../utils/constants';
import { processTrigger } from '../utils/tileInteractions';
import { checkBossPhaseTransition, clearBossAbilitiesCache, resetShadeIdCounter } from '../combat/bossAI';
import { applyDamageToEnemy } from '../combat/damageCalculation';
import { createBossStats } from '../combat/enemyTypes';
import { calculateWeaponDamage } from '../combat/weaponAttack';
import { WEAPON_PREMIUMS } from '../combat/weapons';
import { createRandomWeapon, shouldDropWeapon } from '../combat/weaponGenerator';
import { createRandomArmor, shouldDropArmor } from '../combat/armor';
import { STATUS_EFFECTS } from '../combat/statusEffects';
import { getLocalizedEnemyName, getLocalizedBossName } from '../utils/i18n';
import { useDungeonStore } from '../dungeon/dungeonStore';
import { getTotalFloors } from '../dungeon/config';
import type { StatModifier } from '../progression/types';
import { useDamageNumberStore } from './damageNumberStore';
import { useMetaProgressionStore } from './metaProgressionStore';

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
    default: {
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
  let maxHp = hp;
  const attack = BASE_PLAYER_STATS.attack + charClass.statModifiers.attack;
  const defense = BASE_PLAYER_STATS.defense + charClass.statModifiers.defense;

  if (background.effect.type === 'bonus_hp') {
    hp += background.effect.amount;
    maxHp += background.effect.amount;
  }

  return { hp, maxHp, attack, defense };
};

let combatLogIdCounter = 0;

interface PlayerState {
  position: Position;
  facing: Direction;
  stats: CombatStats;
  classId: CharacterClassId;
  backgroundId: BackgroundId;
  weapon: Weapon | null;
  armor: Armor | null;
  statusEffects: Map<StatusEffectId, StatusEffect>;
}

export type WeatherType = 'clear' | 'rain' | 'fog';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type MapType = 'world' | 'dungeon';

const BASE_VISION_RADIUS = 8;
const POS_KEY_MULTIPLIER = 100000;

const STATUS_EFFECT_SOURCE_PLAYER = 'player' as const;

const posKey = (x: number, y: number): number => y * POS_KEY_MULTIPLIER + x;

function getVisibleTiles(x: number, y: number, visionRadius: number = BASE_VISION_RADIUS): Set<number> {
  const visible = new Set<number>();
  const radiusSq = visionRadius * visionRadius;
  for (let dy = -visionRadius; dy <= visionRadius; dy++) {
    for (let dx = -visionRadius; dx <= visionRadius; dx++) {
      if (dx * dx + dy * dy <= radiusSq) {
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
  newY: number,
  visionRadius: number = BASE_VISION_RADIUS
): VisibilityDelta {
  const dx = newX - oldX;
  const dy = newY - oldY;
  const radiusSq = visionRadius * visionRadius;

  if (dx === 0 && dy === 0) {
    return { toAdd: [], toRemove: [] };
  }

  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    const oldVisible = getVisibleTiles(oldX, oldY, visionRadius);
    const newVisible = getVisibleTiles(newX, newY, visionRadius);
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

  // 1タイル移動時、新位置で見える範囲は旧位置から見ると最大 visionRadius+1 離れている
  // そのため、ループ範囲を拡張して端のタイルも正しく検出する
  const DELTA_RANGE = visionRadius + 1;

  for (let i = -DELTA_RANGE; i <= DELTA_RANGE; i++) {
    for (let j = -DELTA_RANGE; j <= DELTA_RANGE; j++) {
      const oldDistSq = i * i + j * j;
      const newI = i - dx;
      const newJ = j - dy;
      const newDistSq = newI * newI + newJ * newJ;

      const wasVisible = oldDistSq <= radiusSq;
      const isVisible = newDistSq <= radiusSq;

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
  permanentVisionPenalty: number;
  floorVisionPenalty: number;
  floorStatModifiers: StatModifier[];

  enemies: Map<EnemyId, Enemy>;
  currentBoss: Boss | null;
  bossDefeatedOnFloor: boolean;
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
  revealAllTiles: () => void;
  revealTrapTiles: () => void;
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
  clearStatusEffect: (effectId?: StatusEffectId) => void;
  addStatusEffect: (effect: StatusEffect) => void;
  updatePlayerStatusEffects: (effects: Map<StatusEffectId, StatusEffect>) => void;
  setBoss: (boss: Boss | null) => void;
  updateBoss: (updates: Partial<Boss>) => void;
  damageBoss: (amount: number) => void;
  getBossAt: (x: number, y: number) => Boss | null;
  recalculateVisibility: () => void;
  setCharacter: (classId: CharacterClassId, backgroundId: BackgroundId) => void;
  resetGame: () => void;
  pendingWeaponDrop: Weapon | null;
  equipWeapon: (weapon: Weapon) => void;
  discardWeaponDrop: () => void;
  setPendingWeaponDrop: (weapon: Weapon | null) => void;

  pendingArmorDrop: Armor | null;
  equipArmor: (armor: Armor) => void;
  discardArmorDrop: () => void;
  setPendingArmorDrop: (armor: Armor | null) => void;

  pendingRemnantTrade: boolean;
  openRemnantTrade: () => void;
  closeRemnantTrade: () => void;

  addFloorStatModifiers: (modifiers: StatModifier[]) => void;
  clearFloorStatModifiers: () => void;
  addVisionPenalty: (amount: number, permanent: boolean) => void;
  clearFloorPenalties: () => void;
  setInvulnerable: (turns: number) => void;
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
  armor: null,
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
  currentBoss: null,
  bossDefeatedOnFloor: false,
  turnPhase: 'player',
  gameEndState: 'playing',
  combatLog: [],
  pendingWeaponDrop: null,
  pendingArmorDrop: null,
  pendingRemnantTrade: false,
  permanentVisionPenalty: 0,
  floorVisionPenalty: 0,
  floorStatModifiers: [],

  setMap: (map, seed, entryPoint) => {
    const terrainLayer = map.layers.find((l) => l.name === 'terrain') ?? null;
    const featureLayer = map.layers.find((l) => l.name === 'features') ?? null;
    const spawnAt = entryPoint ?? map.spawnPoint;
    const spawnVisible = getVisibleTiles(
      spawnAt.x,
      spawnAt.y,
      Math.max(2, BASE_VISION_RADIUS - get().permanentVisionPenalty - get().floorVisionPenalty)
    );
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
      const isStealthAttack = !enemy.isAware;
      const damageResult = calculateWeaponDamage(
        player.stats,
        enemy.stats,
        player.weapon,
        isStealthAttack
      );
      const { newHp, isDead } = applyDamageToEnemy(enemy.stats.hp, damageResult.damage);
      
      useDamageNumberStore.getState().addDamageNumber(
        enemy.position,
        damageResult.damage,
        damageResult.isCritical,
        false
      );
      
      const nextStatusEffects = new Map(enemy.statusEffects ?? []);
      if (player.weapon) {
        for (const premiumId of player.weapon.premiums) {
          const premium = WEAPON_PREMIUMS[premiumId];
          if (premium.effect.type !== 'status_on_hit') continue;
          if (Math.random() > premium.effect.chance) continue;

          const definition = STATUS_EFFECTS[premium.effect.status];
          const maxStacks = definition?.maxStacks ?? 1;
          const existing = nextStatusEffects.get(premium.effect.status);
          if (existing) {
            nextStatusEffects.set(premium.effect.status, {
              ...existing,
              duration: Math.max(existing.duration, premium.effect.duration),
              stacks: Math.min(existing.stacks + 1, maxStacks),
            });
          } else {
            nextStatusEffects.set(premium.effect.status, {
              id: premium.effect.status,
              duration: premium.effect.duration,
              stacks: 1,
              source: STATUS_EFFECT_SOURCE_PLAYER,
            });
          }
        }
      }

      state.updateEnemy(enemy.id, {
        stats: { ...enemy.stats, hp: newHp },
        isAlive: !isDead,
        isAware: true,
        statusEffects: nextStatusEffects.size > 0 ? nextStatusEffects : undefined,
      });
      
      const enemyName = getLocalizedEnemyName(enemy.type);
      const message = isDead
        ? combat_player_kill({ enemy: enemyName })
        : isStealthAttack
          ? combat_player_stealth_attack({ enemy: enemyName, damage: damageResult.damage })
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
        
        const dungeonState = useDungeonStore.getState();
        const currentFloor = dungeonState.dungeon?.currentFloor ?? 1;
        
        useMetaProgressionStore.getState().recordEnemyEncounter(enemy.type, currentFloor, true);
        
        if (shouldDropWeapon()) {
          const droppedWeapon = createRandomWeapon(currentFloor);
          set({ pendingWeaponDrop: droppedWeapon });
        } else if (shouldDropArmor()) {
          const droppedArmor = createRandomArmor(currentFloor);
          set({ pendingArmorDrop: droppedArmor });
        }
      }
      
      return;
    }

    const boss = state.getBossAt(newX, newY);
    if (boss) {
      const isStealthAttack = !boss.isAware;
      const damageResult = calculateWeaponDamage(
        player.stats,
        boss.stats,
        player.weapon,
        isStealthAttack
      );
      
      if (!boss.isAware) {
        state.updateBoss({ isAware: true });
      }
      
      useDamageNumberStore.getState().addDamageNumber(
        boss.position,
        damageResult.damage,
        damageResult.isCritical,
        false
      );
      
      state.damageBoss(damageResult.damage);
      
      const updatedBoss = get().currentBoss;
      if (updatedBoss) {
        const phaseResult = checkBossPhaseTransition(updatedBoss);
        if (phaseResult.transitioned) {
          const nextStats = createBossStats(updatedBoss.type, phaseResult.newPhase);
          const adjustedHp = Math.min(nextStats.maxHp, updatedBoss.stats.hp);
          state.updateBoss({
            phase: phaseResult.newPhase,
            stats: { ...nextStats, hp: adjustedHp },
          });
          clearBossAbilitiesCache(updatedBoss.id);
        }
        
        const bossName = getLocalizedBossName(boss.type);
        const isDead = !updatedBoss.isAlive;
        const message = isDead
          ? combat_player_kill({ enemy: bossName })
          : isStealthAttack
            ? combat_player_stealth_attack({ enemy: bossName, damage: damageResult.damage })
            : damageResult.isCritical
              ? combat_player_hit_critical({ enemy: bossName, damage: damageResult.damage })
              : combat_player_hit({ enemy: bossName, damage: damageResult.damage });
        
        state.addCombatLogEntry({
          tick: state.tick,
          type: isDead ? 'enemy_death' : 'player_attack',
          message,
          damage: damageResult.damage,
        });
        
        if (isDead) {
          const dungeonState = useDungeonStore.getState();
          const currentFloor = dungeonState.dungeon?.currentFloor ?? 1;
          useMetaProgressionStore.getState().recordBossEncounter(boss.type, currentFloor, true);
        }
      }
      
      return;
    }

    if (canMoveTo(newX, newY)) {
      let facing: Direction = player.facing;
      if (dy < 0) facing = 'up';
      else if (dy > 0) facing = 'down';
      else if (dx < 0) facing = 'left';
      else if (dx > 0) facing = 'right';

      const blindEffect = player.statusEffects.get('blind');
      let visionRadius = BASE_VISION_RADIUS - state.permanentVisionPenalty - state.floorVisionPenalty;
      if (blindEffect && blindEffect.duration > 0) {
        const blindDef = STATUS_EFFECTS.blind;
        if (blindDef.effect.type === 'vision_reduction') {
          visionRadius -= blindDef.effect.radiusReduction;
        }
      }
      visionRadius = Math.max(2, visionRadius);

      const delta = getVisibilityDelta(oldX, oldY, newX, newY, visionRadius);
      
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

  revealAllTiles: () => {
    const { map } = get();
    if (!map) return;

    const revealed = new Set<number>();
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        revealed.add(posKey(x, y));
      }
    }

    set({ exploredTiles: revealed });
  },

  revealTrapTiles: () => {
    const { map, featureLayer, exploredTiles } = get();
    if (!map || !featureLayer) return;

    const revealed = new Set(exploredTiles);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const featureId = featureLayer.data[y]?.[x];
        if (!featureId) continue;
        const tileType = map.tileMapping[String(featureId)] as TileType | undefined;
        if (tileType === 'trap_spike' || tileType === 'trap_pit') {
          revealed.add(posKey(x, y));
        }
      }
    }

    set({ exploredTiles: revealed });
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
    const returnVisible = getVisibleTiles(
      returnPosition.x,
      returnPosition.y,
      Math.max(2, BASE_VISION_RADIUS - get().permanentVisionPenalty - get().floorVisionPenalty)
    );

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
    const playerPos = get().player.position;
    const invulnerable = get().player.statusEffects.get('invulnerable');
    if (invulnerable && invulnerable.duration > 0) return;

    useDamageNumberStore.getState().addDamageNumber(playerPos, amount, false, false);
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
    const playerPos = get().player.position;
    useDamageNumberStore.getState().addDamageNumber(playerPos, amount, false, true);
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
    const currentBoss = get().currentBoss;
    if (currentBoss) {
      clearBossAbilitiesCache(currentBoss.id);
    }
    resetShadeIdCounter();
    set({
      player: {
        ...currentPlayer,
        stats: calculateInitialStats(currentPlayer.classId, currentPlayer.backgroundId),
        statusEffects: new Map(),
      },
      enemies: new Map(),
      currentBoss: null,
      bossDefeatedOnFloor: false,
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

  clearStatusEffect: (effectId) => {
    set((state) => {
      const newEffects = new Map(state.player.statusEffects);
      if (effectId === undefined) {
        newEffects.clear();
      } else {
        newEffects.delete(effectId);
      }
      return {
        player: {
          ...state.player,
          statusEffects: newEffects,
        },
      };
    });
  },

  addStatusEffect: (effect) => {
    set((state) => {
      const definition = STATUS_EFFECTS[effect.id];
      const maxStacks = definition?.maxStacks ?? 1;
      const newEffects = new Map(state.player.statusEffects);
      const existing = newEffects.get(effect.id);
      if (existing) {
        newEffects.set(effect.id, {
          ...effect,
          stacks: Math.min(existing.stacks + effect.stacks, maxStacks),
          duration: Math.max(existing.duration, effect.duration),
        });
      } else {
        newEffects.set(effect.id, effect);
      }
      return {
        player: {
          ...state.player,
          statusEffects: newEffects,
        },
      };
    });
  },

  updatePlayerStatusEffects: (effects) => {
    set((state) => {
      if (state.player.statusEffects === effects) {
        return state;
      }
      return {
        player: {
          ...state.player,
          statusEffects: new Map(effects),
        },
      };
    });
  },

  setBoss: (boss) => {
    set((state) => {
      const prevBoss = state.currentBoss;
      if (prevBoss && (!boss || prevBoss.id !== boss.id)) {
        clearBossAbilitiesCache(prevBoss.id);
      }
      return { currentBoss: boss, bossDefeatedOnFloor: false };
    });
  },

  updateBoss: (updates) => {
    set((state) => {
      if (!state.currentBoss) return state;
      return {
        currentBoss: { ...state.currentBoss, ...updates },
      };
    });
  },

  damageBoss: (amount) => {
    const state = get();
    if (!state.currentBoss) return;
    
    set((s) => {
      if (!s.currentBoss) return s;
      const newHp = Math.max(0, s.currentBoss.stats.hp - amount);
      const isDead = newHp <= 0;
      
      const dungeonState = useDungeonStore.getState();
      const currentFloor = dungeonState.dungeon?.currentFloor ?? 0;
      const totalFloors = getTotalFloors(dungeonState.gameMode);
      const isFinalBoss = isDead && currentFloor >= totalFloors;
      
      let endState: GameEndState = s.gameEndState;
      if (isFinalBoss) {
        const hasTradedWithAll = useMetaProgressionStore.getState().hasTradeWithAllRemnants();
        endState = hasTradedWithAll ? 'victory_true' : 'victory';
      }
      
      return {
        currentBoss: {
          ...s.currentBoss,
          stats: { ...s.currentBoss.stats, hp: newHp },
          isAlive: !isDead,
        },
        bossDefeatedOnFloor: isDead ? true : s.bossDefeatedOnFloor,
        gameEndState: endState,
      };
    });

    const newState = get();
    if (newState.gameEndState === 'victory' || newState.gameEndState === 'victory_true') {
      useMetaProgressionStore.getState().unlockAdvancedMode();
    }
  },

  getBossAt: (x, y) => {
    const { currentBoss } = get();
    if (currentBoss && currentBoss.isAlive && currentBoss.position.x === x && currentBoss.position.y === y) {
      return currentBoss;
    }
    return null;
  },

  recalculateVisibility: () => {
    const { player, exploredTiles, permanentVisionPenalty, floorVisionPenalty } = get();
    const { x, y } = player.position;

    const blindEffect = player.statusEffects.get('blind');
    let visionRadius = BASE_VISION_RADIUS - permanentVisionPenalty - floorVisionPenalty;
    if (blindEffect && blindEffect.duration > 0) {
      const blindDef = STATUS_EFFECTS.blind;
      if (blindDef.effect.type === 'vision_reduction') {
        visionRadius -= blindDef.effect.radiusReduction;
      }
    }
    visionRadius = Math.max(2, visionRadius);

    const newVisibleTiles = getVisibleTiles(x, y, visionRadius);
    const newExploredTiles = new Set(exploredTiles);
    for (const key of newVisibleTiles) {
      newExploredTiles.add(key);
    }

    set({
      visibleTiles: newVisibleTiles,
      exploredTiles: newExploredTiles,
      visibilityHash: x * 10000 + y,
    });
  },


  setCharacter: (classId, backgroundId) => {
    set({
      player: {
        position: { x: 50, y: 50 },
        facing: 'down',
        stats: calculateInitialStats(classId, backgroundId),
        classId,
        backgroundId,
        weapon: null,
        armor: null,
        statusEffects: new Map(),
      },
    });
  },

  resetGame: () => {
    combatLogIdCounter = 0;
    useDungeonStore.getState().exitDungeon();
    useDungeonStore.getState().setGameMode('normal');
    useMetaProgressionStore.getState().clearCurrentRunRemnantTrades();
    set({
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
      permanentVisionPenalty: 0,
      floorVisionPenalty: 0,
      floorStatModifiers: [],
      enemies: new Map<EnemyId, Enemy>(),
      currentBoss: null,
      bossDefeatedOnFloor: false,
      turnPhase: 'player',
      gameEndState: 'playing',
      combatLog: [],
      pendingWeaponDrop: null,
      pendingArmorDrop: null,
      pendingRemnantTrade: false,
    });
  },

  setPendingWeaponDrop: (weapon: Weapon | null) => {
    set({ pendingWeaponDrop: weapon });
  },

  equipWeapon: (weapon: Weapon) => {
    set((state) => ({
      player: {
        ...state.player,
        weapon,
      },
      pendingWeaponDrop: null,
    }));
  },

  discardWeaponDrop: () => {
    set({ pendingWeaponDrop: null });
  },

  setPendingArmorDrop: (armor: Armor | null) => {
    set({ pendingArmorDrop: armor });
  },

  equipArmor: (armor: Armor) => {
    set((state) => ({
      player: {
        ...state.player,
        armor,
      },
      pendingArmorDrop: null,
    }));
  },

  discardArmorDrop: () => {
    set({ pendingArmorDrop: null });
  },

  openRemnantTrade: () => {
    set({ pendingRemnantTrade: true });
  },

  closeRemnantTrade: () => {
    set({ pendingRemnantTrade: false });
  },

  addFloorStatModifiers: (modifiers) => {
    set((state) => {
      const nextFloorModifiers = [...state.floorStatModifiers, ...modifiers];
      let nextStats = state.player.stats;
      for (const modifier of modifiers) {
        nextStats = applyStatModifierToStats(nextStats, modifier);
      }
      const nextHp = Math.max(0, Math.min(nextStats.maxHp, nextStats.hp));
      return {
        floorStatModifiers: nextFloorModifiers,
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

  clearFloorStatModifiers: () => {
    set((state) => {
      if (state.floorStatModifiers.length === 0) return state;
      let nextStats = state.player.stats;
      for (const modifier of state.floorStatModifiers) {
        nextStats = applyStatModifierToStats(nextStats, {
          ...modifier,
          value: -modifier.value,
        });
      }
      const nextHp = Math.max(0, Math.min(nextStats.maxHp, nextStats.hp));
      return {
        floorStatModifiers: [],
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

  addVisionPenalty: (amount, permanent) => {
    set((state) => ({
      permanentVisionPenalty: permanent
        ? Math.max(0, state.permanentVisionPenalty + amount)
        : state.permanentVisionPenalty,
      floorVisionPenalty: !permanent
        ? Math.max(0, state.floorVisionPenalty + amount)
        : state.floorVisionPenalty,
    }));
    get().recalculateVisibility();
  },

  clearFloorPenalties: () => {
    set({ floorVisionPenalty: 0 });
    get().recalculateVisibility();
  },

  setInvulnerable: (turns) => {
    set((state) => {
      const nextEffects = new Map(state.player.statusEffects);
      const existing = nextEffects.get('invulnerable');
      if (existing) {
        nextEffects.set('invulnerable', {
          ...existing,
          duration: Math.max(existing.duration, turns),
          stacks: 1,
        });
      } else {
        nextEffects.set('invulnerable', {
          id: 'invulnerable',
          duration: turns,
          stacks: 1,
          source: 'self',
        });
      }
      return {
        player: {
          ...state.player,
          statusEffects: nextEffects,
        },
      };
    });
  },
}));
