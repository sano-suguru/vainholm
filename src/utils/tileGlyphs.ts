import type { TileType } from '../types';

interface GlowFrame {
  glow: number;
}

interface AnimatedGlow {
  frames: GlowFrame[];
  frameInterval: number;
}

type TileGlowData = number | AnimatedGlow;

const TILE_GLOW_CONFIG: Partial<Record<TileType, TileGlowData>> = {
  lava: {
    frames: [{ glow: 0xff4400 }, { glow: 0xff5500 }, { glow: 0xff3300 }, { glow: 0xff6600 }],
    frameInterval: 300,
  },
  blight: {
    frames: [{ glow: 0x8822cc }, { glow: 0x9933dd }, { glow: 0x7711bb }],
    frameInterval: 500,
  },
  wall_torch: {
    frames: [{ glow: 0xff8800 }, { glow: 0xff9900 }, { glow: 0xff7700 }],
    frameInterval: 200,
  },
  brazier: {
    frames: [{ glow: 0xff4400 }, { glow: 0xff5500 }, { glow: 0xff3300 }, { glow: 0xff6600 }],
    frameInterval: 250,
  },
  crystal: {
    frames: [{ glow: 0x6688dd }, { glow: 0x7799ee }, { glow: 0x5577cc }],
    frameInterval: 600,
  },
  stairs_down: 0xffffaa,
  stairs_up: 0xffffaa,
  door_locked: 0xaa8800,
  cursed_ground: 0x662288,
  altar_dark: 0x6600aa,
};

export function getGlowAtTime(tileType: TileType, time: number, x: number, y: number): number | null {
  const config = TILE_GLOW_CONFIG[tileType];
  if (config === undefined) return null;

  if (typeof config === 'number') return config;

  const phaseOffset = (x + y * 3) * (config.frameInterval / 2);
  const frameIndex = Math.floor((time + phaseOffset) / config.frameInterval) % config.frames.length;
  return config.frames[frameIndex].glow;
}

export function hasGlow(tileType: TileType): boolean {
  return tileType in TILE_GLOW_CONFIG;
}

export const PLAYER_GLYPH = {
  char: '@',
  color: 0xffffff,
};
