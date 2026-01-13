import { describe, it, expect } from 'vitest';
import type { LightScreenData } from '../../utils/lighting';
import { calculateDarknessAt, BASE_DARKNESS } from '../../utils/lighting';

describe('LightLayer darkness calculation', () => {
  it('returns base darkness when no lights are present', () => {
    const darkness = calculateDarknessAt(100, 100, []);
    expect(darkness).toBe(BASE_DARKNESS);
  });

  it('returns base darkness when point is outside all light radii', () => {
    const lights: LightScreenData[] = [
      { screenX: 0, screenY: 0, radius: 50, intensity: 0.8 },
    ];
    const darkness = calculateDarknessAt(100, 100, lights);
    expect(darkness).toBe(BASE_DARKNESS);
  });

  it('reduces darkness at light center', () => {
    const lights: LightScreenData[] = [
      { screenX: 100, screenY: 100, radius: 50, intensity: 0.8 },
    ];
    const darkness = calculateDarknessAt(100, 100, lights);
    expect(darkness).toBeLessThan(BASE_DARKNESS);
    expect(darkness).toBeCloseTo(BASE_DARKNESS * (1 - 0.8), 5);
  });

  it('prevents over-brightness with overlapping lights', () => {
    const singleLight: LightScreenData[] = [
      { screenX: 100, screenY: 100, radius: 50, intensity: 0.8 },
    ];
    const overlappingLights: LightScreenData[] = [
      { screenX: 100, screenY: 100, radius: 50, intensity: 0.8 },
      { screenX: 110, screenY: 100, radius: 50, intensity: 0.8 },
      { screenX: 100, screenY: 110, radius: 50, intensity: 0.8 },
    ];

    const singleDarkness = calculateDarknessAt(100, 100, singleLight);
    const overlappingDarkness = calculateDarknessAt(100, 100, overlappingLights);

    expect(overlappingDarkness).toBeGreaterThanOrEqual(0);
    expect(overlappingDarkness).toBeLessThanOrEqual(BASE_DARKNESS);
    expect(overlappingDarkness).toBeLessThan(singleDarkness);
  });

  it('never produces negative darkness (over-brightness)', () => {
    const manyLights: LightScreenData[] = Array.from({ length: 10 }, (_, i) => ({
      screenX: 100 + i * 5,
      screenY: 100 + i * 5,
      radius: 100,
      intensity: 0.9,
    }));

    const darkness = calculateDarknessAt(100, 100, manyLights);
    expect(darkness).toBeGreaterThanOrEqual(0);
  });

  it('produces smooth falloff from center to edge', () => {
    const lights: LightScreenData[] = [
      { screenX: 100, screenY: 100, radius: 100, intensity: 0.8 },
    ];

    const centerDarkness = calculateDarknessAt(100, 100, lights);
    const midDarkness = calculateDarknessAt(150, 100, lights);
    const edgeDarkness = calculateDarknessAt(199, 100, lights);

    expect(centerDarkness).toBeLessThan(midDarkness);
    expect(midDarkness).toBeLessThan(edgeDarkness);
    expect(edgeDarkness).toBeLessThan(BASE_DARKNESS);
  });
});
