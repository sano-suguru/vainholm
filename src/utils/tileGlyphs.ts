import type { TileType } from '../types';

export interface TileGlyph {
  char: string;
  fg: number;
  bg: number;
  detail?: number;
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
  grass: { char: '.', fg: 0x44aa44, bg: 0x112211, detail: 0x66cc66 },
  water: {
    frames: [
      { char: '~', fg: 0x55aaff, bg: 0x112244, detail: 0x88ddff },
      { char: '~', fg: 0x66bbff, bg: 0x112255, detail: 0x99eeff },
      { char: '≈', fg: 0x55aaff, bg: 0x112244, detail: 0x77ccff },
      { char: '≈', fg: 0x4499ee, bg: 0x111133, detail: 0x66bbff },
    ],
    frameInterval: 400,
  },
  shallow_water: {
    frames: [
      { char: '~', fg: 0x77ccff, bg: 0x223355, detail: 0xaaeeff },
      { char: '~', fg: 0x88ddff, bg: 0x223366, detail: 0xbbffff },
    ],
    frameInterval: 500,
  },
  deep_water: {
    frames: [
      { char: '≈', fg: 0x3366aa, bg: 0x0a1122, detail: 0x4488cc },
      { char: '≈', fg: 0x2255aa, bg: 0x0a1133, detail: 0x3377cc },
      { char: '~', fg: 0x3377bb, bg: 0x0a1122, detail: 0x4499dd },
    ],
    frameInterval: 600,
  },
  forest: { char: 'T', fg: 0x22dd44, bg: 0x112211, detail: 0x44ff66 },
  mountain: { char: '^', fg: 0xbbbbbb, bg: 0x222222, detail: 0xeeeeee },
  hills: { char: 'n', fg: 0x88aa66, bg: 0x223311, detail: 0xaacc88 },
  wall: { char: '#', fg: 0x888888, bg: 0x222222, detail: 0xaaaaaa },
  floor: { char: '.', fg: 0x666655, bg: 0x111111, detail: 0x888877 },
  road: { char: '+', fg: 0xaa8866, bg: 0x221100, detail: 0xccaa88 },
  bridge: { char: '=', fg: 0xaa7744, bg: 0x112244, detail: 0xcc9966 },
  sand: { char: '.', fg: 0xddbb88, bg: 0x332211, detail: 0xffddaa },
  lava: {
    frames: [
      { char: '~', fg: 0xff6622, bg: 0x441100, detail: 0xffaa55, glow: 0xff4400 },
      { char: '≈', fg: 0xff7733, bg: 0x551100, detail: 0xffbb66, glow: 0xff5500 },
      { char: '~', fg: 0xff5511, bg: 0x331100, detail: 0xff9944, glow: 0xff3300 },
      { char: '≈', fg: 0xff8844, bg: 0x441100, detail: 0xffcc77, glow: 0xff6600 },
    ],
    frameInterval: 300,
  },
  swamp: {
    frames: [
      { char: '~', fg: 0x66aa55, bg: 0x112211, detail: 0x88cc77 },
      { char: '~', fg: 0x55aa66, bg: 0x112211, detail: 0x77cc88 },
      { char: '≈', fg: 0x66aa55, bg: 0x112211, detail: 0x88cc77 },
    ],
    frameInterval: 600,
  },
  chasm: { char: ' ', fg: 0x000000, bg: 0x000000 },
  ruins: { char: '%', fg: 0x888877, bg: 0x111111, detail: 0xaaaa99 },
  graveyard: { char: '+', fg: 0x999999, bg: 0x111111, detail: 0xbbbbbb },
  blight: {
    frames: [
      { char: '~', fg: 0xaa55dd, bg: 0x220033, detail: 0xcc77ff, glow: 0x8822cc },
      { char: '~', fg: 0xbb66ee, bg: 0x220033, detail: 0xdd88ff, glow: 0x9933dd },
      { char: '≈', fg: 0x9944cc, bg: 0x220033, detail: 0xbb66ee, glow: 0x7711bb },
    ],
    frameInterval: 500,
  },
  snow: { char: '*', fg: 0xeeeeff, bg: 0x334455, detail: 0xffffff },
  ice: { char: '=', fg: 0xaaddff, bg: 0x223344, detail: 0xccffff },
  frozen_water: {
    frames: [
      { char: '≈', fg: 0x99ccee, bg: 0x223355, detail: 0xbbeeff },
      { char: '=', fg: 0xaaddff, bg: 0x223355, detail: 0xccffff },
    ],
    frameInterval: 800,
  },
  flowers: {
    frames: [
      { char: '"', fg: 0xff88aa, bg: 0x112211, detail: 0xffaacc },
      { char: '"', fg: 0xffaa88, bg: 0x112211, detail: 0xffccaa },
      { char: '"', fg: 0xffff66, bg: 0x112211, detail: 0xffff99 },
    ],
    frameInterval: 700,
  },
  dungeon_floor: { char: '.', fg: 0x555544, bg: 0x0a0a0a, detail: 0x777766 },
  dungeon_wall: { char: '#', fg: 0x555555, bg: 0x111111, detail: 0x777777 },
  stairs_down: { char: '>', fg: 0xffffff, bg: 0x222222, detail: 0xffffcc, glow: 0xffffaa },
  stairs_up: { char: '<', fg: 0xffffff, bg: 0x222222, detail: 0xffffcc, glow: 0xffffaa },
};

export const PLAYER_GLYPH: TileGlyph = {
  char: '@',
  fg: 0xffffff,
  bg: 0x000000,
  glow: 0xffaa00,
};
