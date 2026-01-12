import type { MapData, Position } from '../types';

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

export interface RegionConfig {
  theme: DungeonTheme;
  name: string;
  displayName: string;
  floors: number;
  startFloor: number;
  generatorStyle: GeneratorStyle;
  size: FloorSizeConfig;
  bspConfig: BSPConfig;
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
