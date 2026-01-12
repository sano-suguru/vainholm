import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function deadForestPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  const patchCount = 2 + Math.floor(ctx.random() * 3);

  for (let i = 0; i < patchCount; i++) {
    const cx = 15 + Math.floor(ctx.random() * (ctx.width - 30));
    const cy = 15 + Math.floor(ctx.random() * (ctx.height - 30));
    const radius = 3 + Math.floor(ctx.random() * 3);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < ctx.width - 1 && ny > 0 && ny < ctx.height - 1) {
            const feature = ctx.getFeature(nx, ny);
            const terrain = ctx.getTerrain(nx, ny);
            if (feature === T.forest && ctx.random() < 0.8) {
              mutator.setFeature(nx, ny, T.dead_forest);
            } else if (terrain === T.grass && feature === NO_FEATURE && ctx.random() < 0.6) {
              mutator.setTerrain(nx, ny, T.withered_grass);
            }
          }
        }
      }
    }
  }

  return { success: true };
}

export const DEAD_FOREST_PHASE = {
  name: 'deadForest',
  dependsOn: ['blightedAreas'],
  execute: deadForestPhase,
};
