import type { TileType } from '../tiles';

export type { TileType };

export interface Position {
  x: number;
  y: number;
}

export interface TilePosition extends Position {
  tileType: TileType;
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
  dungeonEntrance?: Position;
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
