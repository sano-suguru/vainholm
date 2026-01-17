import type { GameMode, RegionConfig } from '../types';
import { GLEYMDARIKI_CONFIG } from './gleymdariki';
import { HRODRGRAF_CONFIG } from './hrodrgraf';
import { ROTMYRKR_CONFIG } from './rotmyrkr';
import { UPPHAFSDJUP_CONFIG } from './upphafsdjup';

export { GLEYMDARIKI_CONFIG } from './gleymdariki';
export { HRODRGRAF_CONFIG } from './hrodrgraf';
export { ROTMYRKR_CONFIG } from './rotmyrkr';
export { UPPHAFSDJUP_CONFIG } from './upphafsdjup';

export const REGION_CONFIGS: RegionConfig[] = [
  HRODRGRAF_CONFIG,
  ROTMYRKR_CONFIG,
  GLEYMDARIKI_CONFIG,
  UPPHAFSDJUP_CONFIG,
];

const FLOORS_PER_REGION_NORMAL = 2;
const FLOORS_PER_REGION_ADVANCED = 4;

export function getFloorsPerRegion(mode: GameMode): number {
  return mode === 'advanced' ? FLOORS_PER_REGION_ADVANCED : FLOORS_PER_REGION_NORMAL;
}

export function getRegionConfigByTheme(theme: string): RegionConfig | undefined {
  return REGION_CONFIGS.find((r) => r.theme === theme);
}

export function getRegionConfigForFloor(globalFloor: number, mode: GameMode = 'normal'): RegionConfig | undefined {
  const floorsPerRegion = getFloorsPerRegion(mode);
  let floorCount = 0;
  
  for (const region of REGION_CONFIGS) {
    const regionStart = floorCount + 1;
    const regionEnd = floorCount + floorsPerRegion;
    
    if (globalFloor >= regionStart && globalFloor <= regionEnd) {
      return region;
    }
    floorCount += floorsPerRegion;
  }
  return undefined;
}

export function getTotalFloors(mode: GameMode = 'normal'): number {
  return REGION_CONFIGS.length * getFloorsPerRegion(mode);
}
