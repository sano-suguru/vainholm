import { create } from 'zustand';
import type { Direction, MapData, MapLayer, Position, TileType } from '../types';
import { TILE_DEFINITIONS } from '../utils/constants';

interface PlayerState {
  position: Position;
  facing: Direction;
}

export type WeatherType = 'clear' | 'rain' | 'fog';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

const VISION_RADIUS = 8;
const VISION_RADIUS_SQ = VISION_RADIUS * VISION_RADIUS;

function getVisibleTiles(x: number, y: number): Set<string> {
  const visible = new Set<string>();
  for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
    for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
      if (dx * dx + dy * dy <= VISION_RADIUS_SQ) {
        visible.add(`${x + dx},${y + dy}`);
      }
    }
  }
  return visible;
}

interface VisibilityDelta {
  toAdd: string[];
  toRemove: string[];
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
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    
    newVisible.forEach((key) => {
      if (!oldVisible.has(key)) toAdd.push(key);
    });
    oldVisible.forEach((key) => {
      if (!newVisible.has(key)) toRemove.push(key);
    });
    
    return { toAdd, toRemove };
  }

  const toAdd: string[] = [];
  const toRemove: string[] = [];

  for (let i = -VISION_RADIUS; i <= VISION_RADIUS; i++) {
    for (let j = -VISION_RADIUS; j <= VISION_RADIUS; j++) {
      const oldDistSq = i * i + j * j;
      const newI = i - dx;
      const newJ = j - dy;
      const newDistSq = newI * newI + newJ * newJ;

      const wasVisible = oldDistSq <= VISION_RADIUS_SQ;
      const isVisible = newDistSq <= VISION_RADIUS_SQ;

      if (isVisible && !wasVisible) {
        toAdd.push(`${newX + newI},${newY + newJ}`);
      } else if (wasVisible && !isVisible) {
        toRemove.push(`${oldX + i},${oldY + j}`);
      }
    }
  }

  return { toAdd, toRemove };
}

interface GameStore {
  player: PlayerState;
  map: MapData | null;
  terrainLayer: MapLayer | null;
  debugMode: boolean;
  tick: number;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  exploredTiles: Set<string>;
  visibleTiles: Set<string>;
  visibilityHash: number;

  setMap: (map: MapData) => void;
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
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: {
    position: { x: 50, y: 50 },
    facing: 'down',
  },
  map: null,
  terrainLayer: null,
  debugMode: false,
  tick: 0,
  weather: 'clear',
  timeOfDay: 'day',
  exploredTiles: new Set<string>(),
  visibleTiles: new Set<string>(),
  visibilityHash: 0,

  setMap: (map) => {
    const terrainLayer = map.layers.find((l) => l.name === 'terrain') ?? null;
    const spawnVisible = getVisibleTiles(map.spawnPoint.x, map.spawnPoint.y);
    set({
      map,
      terrainLayer,
      player: {
        position: { ...map.spawnPoint },
        facing: 'down',
      },
      visibleTiles: spawnVisible,
      exploredTiles: new Set(spawnVisible),
      visibilityHash: map.spawnPoint.x * 10000 + map.spawnPoint.y,
    });
  },

  movePlayer: (dx, dy) => {
    const { player, canMoveTo, exploredTiles, visibleTiles } = get();
    const oldX = player.position.x;
    const oldY = player.position.y;
    const newX = oldX + dx;
    const newY = oldY + dy;

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

      set({
        player: {
          position: { x: newX, y: newY },
          facing,
        },
        visibleTiles: newVisibleTiles,
        exploredTiles: newExploredTiles,
        visibilityHash: newX * 10000 + newY,
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
    const { map, terrainLayer } = get();
    if (!map || !terrainLayer) return null;

    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return null;
    }

    const tileId = terrainLayer.data[y]?.[x];
    if (tileId === undefined) return null;

    return map.tileMapping[String(tileId)] || null;
  },

  isTileVisible: (x, y) => {
    const { visibleTiles } = get();
    return visibleTiles.has(`${x},${y}`);
  },

  isTileExplored: (x, y) => {
    const { exploredTiles } = get();
    return exploredTiles.has(`${x},${y}`);
  },
}));
