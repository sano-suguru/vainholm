import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function roadsPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  const centerX = Math.floor(ctx.width / 2);
  const centerY = Math.floor(ctx.height / 2);
  const roadLength = 15 + Math.floor(ctx.random() * 10);

  for (let x = centerX - roadLength; x <= centerX + roadLength; x++) {
    if (x >= 0 && x < ctx.width) {
      const terrain = ctx.getTerrain(x, centerY);
      if (terrain !== T.water && terrain !== T.deep_water) {
        mutator.setTerrain(x, centerY, T.road);
        mutator.setFeature(x, centerY, NO_FEATURE);
      }
    }
  }

  for (let y = centerY - roadLength; y <= centerY + roadLength; y++) {
    if (y >= 0 && y < ctx.height) {
      const terrain = ctx.getTerrain(centerX, y);
      if (terrain !== T.water && terrain !== T.deep_water) {
        mutator.setTerrain(centerX, y, T.road);
        mutator.setFeature(centerX, y, NO_FEATURE);
      }
    }
  }

  return { success: true };
}

export const ROADS_PHASE = {
  name: 'roads',
  dependsOn: ['lakes'],
  execute: roadsPhase,
};
