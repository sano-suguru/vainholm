import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function riverPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  let x = Math.floor(ctx.width * 0.3 + ctx.random() * ctx.width * 0.4);
  let y = 0;

  while (y < ctx.height) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      if (nx >= 0 && nx < ctx.width) {
        mutator.setTerrain(nx, y, T.water);
        mutator.setFeature(nx, y, NO_FEATURE);
      }
    }

    y++;
    const drift = ctx.random();
    if (drift < 0.3) x = Math.max(5, x - 1);
    else if (drift > 0.7) x = Math.min(ctx.width - 6, x + 1);
  }

  return { success: true };
}

export const RIVER_PHASE = {
  name: 'river',
  dependsOn: [] as string[],
  execute: riverPhase,
};
