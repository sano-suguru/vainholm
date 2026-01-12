import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function swampsPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  for (let y = 1; y < ctx.height - 1; y++) {
    for (let x = 1; x < ctx.width - 1; x++) {
      if (ctx.getTerrain(x, y) === T.water) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < ctx.width && ny >= 0 && ny < ctx.height) {
              if (ctx.getTerrain(nx, ny) === T.grass && ctx.getFeature(nx, ny) === NO_FEATURE && ctx.random() < 0.3) {
                mutator.setTerrain(nx, ny, T.swamp);
              }
            }
          }
        }
      }
    }
  }

  return { success: true };
}

export const SWAMPS_PHASE = {
  name: 'swamps',
  dependsOn: ['roads'],
  execute: swampsPhase,
};
