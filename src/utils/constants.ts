export { TILE_DEFINITIONS } from '../tiles';

export const TILE_SIZE = 16;
export const VIEWPORT_WIDTH_TILES = 50;
export const VIEWPORT_HEIGHT_TILES = 38;
export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 60;

export const KEY_BINDINGS = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  debug: ['F3'],
  quickbar: ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
} as const;
