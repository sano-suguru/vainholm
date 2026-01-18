import type { MapData, Position } from '../types';
import type { TileType } from '../tiles';

/** Type-safe tile weight map. Typos cause compile errors. */
export type TileWeights = Partial<Record<TileType, number>>;

export type GameMode = 'normal' | 'advanced';

// ─────────────────────────────────────────────────────────────────────────────
// Dungeon Collapse System (時間制約による崩壊)
// ─────────────────────────────────────────────────────────────────────────────

/** 崩壊システムの定数 */
export const COLLAPSE_CONSTANTS = {
  /** 崩壊開始ターン（序盤は自由探索） */
  START_TICK: 200,
  /** 崩壊速度：1フロアあたりのターン数 */
  TICKS_PER_FLOOR: 50,
} as const;

/** 崩壊したフロアを計算（純粋関数） */
export function getCollapsedFloor(tick: number): number {
  if (tick < COLLAPSE_CONSTANTS.START_TICK) return 0;
  return Math.floor((tick - COLLAPSE_CONSTANTS.START_TICK) / COLLAPSE_CONSTANTS.TICKS_PER_FLOOR) + 1;
}

/** 現在のフロアが崩壊するまでの残りターン数を計算 */
export function getTurnsUntilCollapse(tick: number, currentFloor: number): number | null {
  // 崩壊開始前
  if (tick < COLLAPSE_CONSTANTS.START_TICK) {
    const turnsUntilStart = COLLAPSE_CONSTANTS.START_TICK - tick;
    const turnsAfterStart = (currentFloor - 1) * COLLAPSE_CONSTANTS.TICKS_PER_FLOOR;
    return turnsUntilStart + turnsAfterStart;
  }
  
  // 崩壊進行中
  const collapsedFloor = getCollapsedFloor(tick);
  if (currentFloor <= collapsedFloor) {
    return 0; // 既に崩壊している
  }
  
  const tickWhenCurrentFloorCollapses = 
    COLLAPSE_CONSTANTS.START_TICK + (currentFloor - 1) * COLLAPSE_CONSTANTS.TICKS_PER_FLOOR;
  return tickWhenCurrentFloorCollapses - tick;
}

/** プレイヤーが崩壊に巻き込まれたか */
export function isPlayerCaughtByCollapse(playerFloor: number, tick: number): boolean {
  const collapsedFloor = getCollapsedFloor(tick);
  return playerFloor <= collapsedFloor;
}

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
  /** Maximum distance between rooms to consider for shortcuts (default: 15) */
  shortcutMaxDistance?: number;
  /** Probability of creating a shortcut between eligible rooms (default: 0.3) */
  shortcutChance?: number;
  /** Maximum number of shortcut corridors to add (default: 2) */
  maxShortcuts?: number;
  /** Probability of adding extra bends to corridors (default: 0) */
  extraBendChance?: number;
  /** Maximum extra bends per corridor (default: 1) */
  maxExtraBends?: number;
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
  distanceScaling?: boolean;
  maxDistanceMultiplier?: number;
}

export interface LightingConfig {
  lightingChance: number;
  lightsPerRoom: number;
  lightingTiles: TileWeights;
}

export interface HazardConfig {
  hazardChance: number;
  hazardTiles: TileWeights;
  distanceScaling?: boolean;
  maxDistanceMultiplier?: number;
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
  multiTileConfig?: MultiTileConfig;
  collapseConfig?: CollapseConfig;
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
  bends?: Position[];
}

export type MultiTileObjectType = 'fallen_pillar' | 'broken_statue' | 'collapsed_arch';

export interface MultiTileObjectDef {
  type: MultiTileObjectType;
  width: number;
  height: number;
  weight: number;
}

export interface MultiTileObject {
  id: string;
  type: MultiTileObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MultiTileConfig {
  objectChance: number;
  maxObjectsPerFloor: number;
  objects: MultiTileObjectDef[];
}

export interface CollapseConfig {
  collapseChance: number;
  minCollapseSize: number;
  maxCollapseSize: number;
  maxCollapseZones: number;
  crackedFloorRadius: number;
  floorScaling?: boolean;
  maxFloorMultiplier?: number;
  /** 壁も崩落対象にするか（中心=穴、縁=瓦礫） */
  affectWalls?: boolean;
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
  multiTileObjects: MultiTileObject[];
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
  regionLevel: number;
  floorsPerRegion: number;
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
