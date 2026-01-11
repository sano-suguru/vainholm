import type { Position, TileType } from '../types';

export interface LightSource {
  id: string;
  position: Position;
  color: number;
  minRadius: number;
  maxRadius: number;
  intensity: number;
  colorVariance: number;
  flickerSpeed: number;
  flickerAmount: number;
}

export interface LightState {
  radius: number;
  intensity: number;
  color: number;
}

export const LIGHT_PRESETS: Record<string, Omit<LightSource, 'id' | 'position'>> = {
  torch: {
    color: 0xff8822,
    minRadius: 4,
    maxRadius: 6,
    intensity: 0.15,
    colorVariance: 0.08,
    flickerSpeed: 1.0,
    flickerAmount: 0.15,
  },
  
  lava: {
    color: 0xff4400,
    minRadius: 1,
    maxRadius: 2.5,
    intensity: 0.12,
    colorVariance: 0.15,
    flickerSpeed: 0.6,
    flickerAmount: 0.2,
  },
  
  blight: {
    color: 0xaa44ff,
    minRadius: 1,
    maxRadius: 2,
    intensity: 0.08,
    colorVariance: 0.1,
    flickerSpeed: 0.4,
    flickerAmount: 0.1,
  },
  
  magic: {
    color: 0x66aaff,
    minRadius: 2,
    maxRadius: 4,
    intensity: 0.3,
    colorVariance: 0.05,
    flickerSpeed: 0.8,
    flickerAmount: 0.08,
  },
  
  campfire: {
    color: 0xffaa33,
    minRadius: 4,
    maxRadius: 6,
    intensity: 0.4,
    colorVariance: 0.12,
    flickerSpeed: 1.2,
    flickerAmount: 0.25,
  },
  
  wallTorch: {
    color: 0xff9922,
    minRadius: 3,
    maxRadius: 5,
    intensity: 0.3,
    colorVariance: 0.1,
    flickerSpeed: 1.1,
    flickerAmount: 0.18,
  },
  
  mushroom: {
    color: 0x44ffaa,
    minRadius: 1,
    maxRadius: 2,
    intensity: 0.2,
    colorVariance: 0.05,
    flickerSpeed: 0.3,
    flickerAmount: 0.05,
  },
  
  stairs: {
    color: 0xffffee,
    minRadius: 1,
    maxRadius: 2,
    intensity: 0.15,
    colorVariance: 0.02,
    flickerSpeed: 0.2,
    flickerAmount: 0.03,
  },
};

export const TILE_LIGHT_SOURCES: Partial<Record<TileType, keyof typeof LIGHT_PRESETS>> = {
  lava: 'lava',
  stairs_down: 'stairs',
  stairs_up: 'stairs',
};

export function createLightSource(
  id: string,
  position: Position,
  preset: keyof typeof LIGHT_PRESETS | Partial<Omit<LightSource, 'id' | 'position'>> = 'torch'
): LightSource {
  const defaults = typeof preset === 'string' 
    ? LIGHT_PRESETS[preset] 
    : { ...LIGHT_PRESETS.torch, ...preset };
  
  return {
    id,
    position,
    ...defaults,
  };
}

export function getLightFlicker(
  light: LightSource,
  time: number,
  seedX: number = 0,
  seedY: number = 0
): LightState {
  const speed = light.flickerSpeed;
  const amount = light.flickerAmount;
  
  const t1 = Math.sin(time * 0.0015 * speed) * 0.5 + 0.5;
  const t2 = Math.sin(time * 0.002 * speed + 1.5) * 0.5 + 0.5;
  const t3 = Math.sin(time * 0.003 * speed + seedX * 0.1 + seedY * 0.1) * 0.5 + 0.5;
  
  const flicker = t1 * 0.5 + t2 * 0.3 + t3 * 0.2;
  
  const radiusRange = light.maxRadius - light.minRadius;
  const radius = light.minRadius + radiusRange * (0.5 + (flicker - 0.5) * amount * 2);
  
  const intensity = light.intensity * (1 - amount * 0.5 + flicker * amount);
  
  const color = applyColorVariance(light.color, light.colorVariance, flicker);
  
  return { radius, intensity, color };
}

function applyColorVariance(baseColor: number, variance: number, flicker: number): number {
  const r = (baseColor >> 16) & 0xff;
  const g = (baseColor >> 8) & 0xff;
  const b = baseColor & 0xff;
  
  const warmShift = (flicker - 0.5) * variance * 255;
  
  const newR = Math.max(0, Math.min(255, Math.round(r + warmShift * 0.5)));
  const newG = Math.max(0, Math.min(255, Math.round(g + warmShift * 0.2)));
  const newB = Math.max(0, Math.min(255, Math.round(b - warmShift * 0.3)));
  
  return (newR << 16) | (newG << 8) | newB;
}

export function getVisibleLights(
  lights: LightSource[],
  viewport: { startX: number; startY: number; endX: number; endY: number },
  margin: number = 10
): LightSource[] {
  return lights.filter(light => 
    light.position.x >= viewport.startX - margin &&
    light.position.x < viewport.endX + margin &&
    light.position.y >= viewport.startY - margin &&
    light.position.y < viewport.endY + margin
  );
}
