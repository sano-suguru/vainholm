import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

export type Noise2DFunction = (x: number, y: number) => number;

export interface NoiseConfig {
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
}

const DEFAULT_CONFIG: NoiseConfig = {
  scale: 0.02,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0,
};

export function createSeededNoise2D(seed: number | string): Noise2DFunction {
  return createNoise2D(alea(String(seed)));
}

export function fbm(
  noise2D: Noise2DFunction,
  x: number,
  y: number,
  config: Partial<NoiseConfig> = {}
): number {
  const { scale, octaves, persistence, lacunarity } = { ...DEFAULT_CONFIG, ...config };

  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

export function normalizeNoise(value: number): number {
  return (value + 1) / 2;
}
