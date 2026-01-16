import type { RegionConfig } from '../types';
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

export function getRegionConfigByTheme(theme: string): RegionConfig | undefined {
  return REGION_CONFIGS.find((r) => r.theme === theme);
}

export function getRegionConfigForFloor(globalFloor: number): RegionConfig | undefined {
  for (const region of REGION_CONFIGS) {
    const regionEnd = region.startFloor + region.floors - 1;
    if (globalFloor >= region.startFloor && globalFloor <= regionEnd) {
      return region;
    }
  }
  return undefined;
}

export function getTotalFloors(): number {
  return REGION_CONFIGS.reduce((sum, r) => sum + r.floors, 0);
}
