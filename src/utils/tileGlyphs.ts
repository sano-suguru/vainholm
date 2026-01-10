import type { TileType } from '../types';

export interface TileGlyph {
  char: string;
  fg: number;
  bg: number;
  glow?: number;
}

interface AnimatedTileGlyph {
  frames: TileGlyph[];
  frameInterval: number; // milliseconds per frame
}

export type TileGlyphData = TileGlyph | AnimatedTileGlyph;

function isAnimatedGlyph(glyph: TileGlyphData): glyph is AnimatedTileGlyph {
  return 'frames' in glyph;
}

export function isAnimatedTile(tileType: TileType): boolean {
  const glyphData = TILE_GLYPHS[tileType];
  return glyphData ? isAnimatedGlyph(glyphData) : false;
}

export function getStaticGlyph(tileType: TileType): TileGlyph {
  const glyphData = TILE_GLYPHS[tileType] || TILE_GLYPHS.grass;
  if (isAnimatedGlyph(glyphData)) {
    return glyphData.frames[0];
  }
  return glyphData;
}

export function getGlyphAtTime(glyph: TileGlyphData, time: number, x: number, y: number): TileGlyph {
  if (!isAnimatedGlyph(glyph)) {
    return glyph;
  }
  // Use position to offset animation phase (creates wave effect)
  const phaseOffset = (x + y * 3) * (glyph.frameInterval / 2);
  const frameIndex = Math.floor((time + phaseOffset) / glyph.frameInterval) % glyph.frames.length;
  return glyph.frames[frameIndex];
}

export const TILE_GLYPHS: Record<TileType, TileGlyphData> = {
  grass: { char: '.', fg: 0x44aa44, bg: 0x112211 },
  water: {
    frames: [
      { char: '~', fg: 0x55aaff, bg: 0x112244 },
      { char: '~', fg: 0x66bbff, bg: 0x112255 },
      { char: '≈', fg: 0x55aaff, bg: 0x112244 },
      { char: '≈', fg: 0x4499ee, bg: 0x111133 },
    ],
    frameInterval: 400,
  },
  shallow_water: {
    frames: [
      { char: '~', fg: 0x77ccff, bg: 0x223355 },
      { char: '~', fg: 0x88ddff, bg: 0x223366 },
    ],
    frameInterval: 500,
  },
  deep_water: {
    frames: [
      { char: '≈', fg: 0x3366aa, bg: 0x0a1122 },
      { char: '≈', fg: 0x2255aa, bg: 0x0a1133 },
      { char: '~', fg: 0x3377bb, bg: 0x0a1122 },
    ],
    frameInterval: 600,
  },
  forest: { char: 'T', fg: 0x22dd44, bg: 0x112211 },
  mountain: { char: '^', fg: 0xbbbbbb, bg: 0x222222 },
  hills: { char: 'n', fg: 0x88aa66, bg: 0x223311 },
  wall: { char: '#', fg: 0x888888, bg: 0x222222 },
  floor: { char: '.', fg: 0x666655, bg: 0x111111 },
  road: { char: '+', fg: 0xaa8866, bg: 0x221100 },
  bridge: { char: '=', fg: 0xaa7744, bg: 0x112244 },
  sand: { char: '.', fg: 0xddbb88, bg: 0x332211 },
  lava: {
    frames: [
      { char: '~', fg: 0xff6622, bg: 0x441100, glow: 0xff4400 },
      { char: '≈', fg: 0xff7733, bg: 0x551100, glow: 0xff5500 },
      { char: '~', fg: 0xff5511, bg: 0x331100, glow: 0xff3300 },
      { char: '≈', fg: 0xff8844, bg: 0x441100, glow: 0xff6600 },
    ],
    frameInterval: 300,
  },
  swamp: {
    frames: [
      { char: '~', fg: 0x66aa55, bg: 0x112211 },
      { char: '~', fg: 0x55aa66, bg: 0x112211 },
      { char: '≈', fg: 0x66aa55, bg: 0x112211 },
    ],
    frameInterval: 600,
  },
  chasm: { char: ' ', fg: 0x000000, bg: 0x000000 },
  ruins: { char: '%', fg: 0x888877, bg: 0x111111 },
  graveyard: { char: '+', fg: 0x999999, bg: 0x111111 },
  blight: {
    frames: [
      { char: '~', fg: 0xaa55dd, bg: 0x220033 },
      { char: '~', fg: 0xbb66ee, bg: 0x220033 },
      { char: '≈', fg: 0x9944cc, bg: 0x220033 },
    ],
    frameInterval: 500,
  },
  snow: { char: '*', fg: 0xeeeeff, bg: 0x334455 },
  ice: { char: '=', fg: 0xaaddff, bg: 0x223344 },
  frozen_water: {
    frames: [
      { char: '≈', fg: 0x99ccee, bg: 0x223355 },
      { char: '=', fg: 0xaaddff, bg: 0x223355 },
    ],
    frameInterval: 800,
  },
  flowers: {
    frames: [
      { char: '"', fg: 0xff88aa, bg: 0x112211 },
      { char: '"', fg: 0xffaa88, bg: 0x112211 },
      { char: '"', fg: 0xffff66, bg: 0x112211 },
    ],
    frameInterval: 700,
  },
  dungeon_floor: { char: '.', fg: 0x555544, bg: 0x0a0a0a },
  dungeon_wall: { char: '#', fg: 0x555555, bg: 0x111111 },
  stairs_down: { char: '>', fg: 0xffffff, bg: 0x222222 },
  stairs_up: { char: '<', fg: 0xffffff, bg: 0x222222 },
};

export const PLAYER_GLYPH: TileGlyph = {
  char: '@',
  fg: 0xffffff,
  bg: 0x000000,
  glow: 0xffaa00,
};
