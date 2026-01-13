import type { MapData, Position } from '../types';
import type { TileType } from '../tiles';

/** Type-safe tile weight map. Typos cause compile errors. */
export type TileWeights = Partial<Record<TileType, number>>;

export type DungeonTheme =
  | 'hrodrgraf'
  | 'rotmyrkr'
  | 'gleymdariki'
  | 'upphafsdjup'
  | 'frostdjup'
  | 'sannleiksholmr';

export type GeneratorStyle = 'bsp' | 'cellular' | 'hybrid';

export interface BSPConfig {
  minRoomSize: number;
  maxRoomSize: number;
  minRooms: number;
  maxRooms: number;
  corridorWidth: number;
  allowLCorridors: boolean;
  roomMargin: number;
}

export interface FloorSizeConfig {
  base: { width: number; height: number };
  perFloor?: Record<number, { width: number; height: number }>;
}

export interface DecorationConfig {
  roomDecorationChance: number;
  minRoomSizeForStructures: number;
  decorationTiles: TileWeights;
}

export interface TrapConfig {
  trapChance: number;
  trapsPerRoom: number;
  trapTiles: TileWeights;
}

export interface LightingConfig {
  lightingChance: number;
  lightsPerRoom: number;
  lightingTiles: TileWeights;
}

export interface HazardConfig {
  hazardChance: number;
  hazardTiles: TileWeights;
}

/**
 * Door placement configuration.
 *
 * Door type probabilities are cumulative:
 * - secretChance: probability of secret door
 * - lockedChance: probability of locked door (after secret check)
 * - Regular doors fill the remaining probability
 *
 * @example
 * // With secretChance: 0.1, lockedChance: 0.2:
 * // - 10% secret doors
 * // - 20% locked doors
 * // - 70% regular doors
 *
 * @throws {Error} if secretChance + lockedChance > 1
 */
export interface DoorConfig {
  /** Probability of placing any door (0-1) */
  doorChance: number;
  /** Probability of locked door when placing (0-1, must sum with secretChance <= 1) */
  lockedChance: number;
  /** Probability of secret door when placing (0-1, must sum with lockedChance <= 1) */
  secretChance: number;
}

export interface RegionConfig {
  theme: DungeonTheme;
  name: string;
  displayName: string;
  floors: number;
  startFloor: number;
  generatorStyle: GeneratorStyle;
  size: FloorSizeConfig;
  bspConfig: BSPConfig;
  decorationConfig?: DecorationConfig;
  trapConfig?: TrapConfig;
  lightingConfig?: LightingConfig;
  hazardConfig?: HazardConfig;
  doorConfig?: DoorConfig;
}

export type RoomType = 'entrance' | 'exit' | 'boss' | 'treasure';

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  center: Position;
  roomType?: RoomType;
}

export interface Corridor {
  start: Position;
  end: Position;
  width: number;
  bend?: Position;
}

export interface DungeonFloor {
  level: number;
  regionLevel: number;
  theme: DungeonTheme;
  map: MapData;
  stairsUp: Position | null;
  stairsDown: Position | null;
  rooms: Room[];
  corridors: Corridor[];
  visited: boolean;
  seed: number;
}

export interface Dungeon {
  id: string;
  name: string;
  regions: RegionConfig[];
  floors: Map<number, DungeonFloor>;
  currentFloor: number;
  deepestReached: number;
  baseSeed: number;
  maxFloors: number;
}

export interface FloorGenerationOptions {
  level: number;
  regionConfig: RegionConfig;
  seed: number;
  previousStairsDown: Position | null;
  isLastFloorInDungeon: boolean;
}

export interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  room?: Room;
  left?: BSPNode;
  right?: BSPNode;
}

export interface BSPResult {
  rooms: Room[];
  corridors: Corridor[];
}
