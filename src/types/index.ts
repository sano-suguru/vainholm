export interface Position {
  x: number;
  y: number;
}

export type TileType =
  | 'grass'
  | 'water'
  | 'shallow_water'
  | 'deep_water'
  | 'forest'
  | 'mountain'
  | 'hills'
  | 'wall'
  | 'floor'
  | 'road'
  | 'bridge'
  | 'sand'
  | 'lava'
  | 'swamp'
  | 'chasm'
  | 'ruins'
  | 'graveyard'
  | 'blight'
  | 'snow'
  | 'ice'
  | 'frozen_water'
  | 'flowers'
  | 'dungeon_floor'
  | 'dungeon_wall'
  | 'stairs_down'
  | 'stairs_up';

export interface TileDefinition {
  type: TileType;
  walkable: boolean;
  movementCost: number;
  name: string;
  char: string;
}

export type TileId = number;

export interface MapLayer {
  name: string;
  data: TileId[][];
}

export interface MapData {
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: MapLayer[];
  tileMapping: Record<string, TileType>;
  spawnPoint: Position;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface ViewportBounds {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface AnimatedViewportProps {
  viewport: ViewportBounds;
  animationTime: number;
}
