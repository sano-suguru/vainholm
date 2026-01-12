import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function toxicMarshesPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  const marshCount = 1 + Math.floor(ctx.random() * 2);

  for (let i = 0; i < marshCount; i++) {
    const cx = 10 + Math.floor(ctx.random() * (ctx.width - 20));
    const cy = 10 + Math.floor(ctx.random() * (ctx.height - 20));
    const radius = 2 + Math.floor(ctx.random() * 3);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + ctx.random() * 0.5) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < ctx.width - 1 && ny > 0 && ny < ctx.height - 1) {
            const terrain = ctx.getTerrain(nx, ny);
            if ((terrain === T.swamp || terrain === T.grass) && ctx.getFeature(nx, ny) === NO_FEATURE && ctx.random() < 0.7) {
              mutator.setTerrain(nx, ny, T.toxic_marsh);
            }
          }
        }
      }
    }
  }

  return { success: true };
}

export const TOXIC_MARSHES_PHASE = {
  name: 'toxicMarshes',
  dependsOn: ['deadForest'],
  execute: toxicMarshesPhase,
};
