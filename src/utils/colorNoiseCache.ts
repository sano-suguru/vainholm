const noiseCache = new Map<number, number>();

function hashPosition(x: number, y: number): number {
  const n = x * 374761393 + y * 668265263;
  return ((n ^ (n >> 13)) * 1274126177) >>> 0;
}

function computeNoise(x: number, y: number): number {
  const hash = hashPosition(x, y);
  return ((hash % 1000) / 1000 - 0.5) * 2;
}

export function clearColorNoiseCache(): void {
  noiseCache.clear();
}

/**
 * Generates a numeric cache key from x,y coordinates.
 * Uses 16-bit packing: upper 16 bits for x, lower 16 bits for y.
 * 
 * @warning Coordinates must be in range 0-65535 (16-bit unsigned).
 * Coordinates outside this range will cause key collisions.
 * Current map size (200x200) is safe.
 */
function positionKey(x: number, y: number): number {
  return (x << 16) | (y & 0xffff);
}

function getCachedNoise(x: number, y: number): number {
  const key = positionKey(x, y);
  let variation = noiseCache.get(key);
  if (variation === undefined) {
    variation = computeNoise(x, y);
    noiseCache.set(key, variation);
  }
  return variation;
}

export function applyColorWithCachedNoise(
  color: number, 
  x: number, 
  y: number, 
  intensity: number
): number {
  const variation = getCachedNoise(x, y) * intensity;
  
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  
  const adjust = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 + variation))));
  
  return (adjust(r) << 16) | (adjust(g) << 8) | adjust(b);
}
