import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function graveyardsPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  const graveyardCount = 2 + Math.floor(ctx.random() * 2);

  for (let i = 0; i < graveyardCount; i++) {
    const cx = 15 + Math.floor(ctx.random() * (ctx.width - 30));
    const cy = 15 + Math.floor(ctx.random() * (ctx.height - 30));
    const sizeX = 3 + Math.floor(ctx.random() * 3);
    const sizeY = 2 + Math.floor(ctx.random() * 2);

    for (let dy = -sizeY; dy <= sizeY; dy++) {
      for (let dx = -sizeX; dx <= sizeX; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx > 0 && nx < ctx.width - 1 && ny > 0 && ny < ctx.height - 1) {
          if (ctx.getTerrain(nx, ny) === T.grass && ctx.getFeature(nx, ny) === NO_FEATURE) {
            mutator.setFeature(nx, ny, T.graveyard);
          }
        }
      }
    }
  }

  return { success: true };
}

export const GRAVEYARDS_PHASE = {
  name: 'graveyards',
  dependsOn: ['ruins'],
  execute: graveyardsPhase,
};
