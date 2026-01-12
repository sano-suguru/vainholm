import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function charredAreasPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  for (let y = 1; y < ctx.height - 1; y++) {
    for (let x = 1; x < ctx.width - 1; x++) {
      if (ctx.getTerrain(x, y) === T.lava) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx > 0 && nx < ctx.width - 1 && ny > 0 && ny < ctx.height - 1) {
              const terrain = ctx.getTerrain(nx, ny);
              const feature = ctx.getFeature(nx, ny);
              if ((terrain === T.grass || feature === T.forest) && ctx.random() < 0.5) {
                mutator.setTerrain(nx, ny, T.charred_ground);
                mutator.setFeature(nx, ny, NO_FEATURE);
              }
            }
          }
        }
      }
    }
  }

  return { success: true };
}

export const CHARRED_AREAS_PHASE = {
  name: 'charredAreas',
  dependsOn: ['toxicMarshes'],
  execute: charredAreasPhase,
};
