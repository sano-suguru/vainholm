import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;

export function blightedAreasPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  const blightCount = 2 + Math.floor(ctx.random() * 3);

  for (let i = 0; i < blightCount; i++) {
    const cx = 10 + Math.floor(ctx.random() * (ctx.width - 20));
    const cy = 10 + Math.floor(ctx.random() * (ctx.height - 20));
    const radius = 4 + Math.floor(ctx.random() * 4);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < ctx.width - 1 && ny > 0 && ny < ctx.height - 1) {
            const terrain = ctx.getTerrain(nx, ny);
            if (terrain === T.grass && ctx.random() < 0.7) {
              mutator.setFeature(nx, ny, T.blight);
            }
          }
        }
      }
    }
  }

  return { success: true };
}

export const BLIGHTED_AREAS_PHASE = {
  name: 'blightedAreas',
  dependsOn: ['graveyards'],
  execute: blightedAreasPhase,
};
