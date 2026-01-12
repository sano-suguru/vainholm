import type { Position } from '../../../types';
import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function ruinsPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  const ruinCount = 3 + Math.floor(ctx.random() * 4);
  let firstRuinCenter: Position | null = null;

  for (let i = 0; i < ruinCount; i++) {
    const cx = 10 + Math.floor(ctx.random() * (ctx.width - 20));
    const cy = 10 + Math.floor(ctx.random() * (ctx.height - 20));
    const size = 2 + Math.floor(ctx.random() * 2);

    if (i === 0) {
      firstRuinCenter = { x: cx, y: cy };
    }

    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx > 0 && nx < ctx.width - 1 && ny > 0 && ny < ctx.height - 1) {
          if (ctx.getTerrain(nx, ny) === T.grass && ctx.getFeature(nx, ny) === NO_FEATURE && ctx.random() < 0.6) {
            mutator.setFeature(nx, ny, T.ruins);
          }
        }
      }
    }
  }

  if (firstRuinCenter) {
    mutator.setMetadata('ruinCenter', firstRuinCenter);
  }

  return {
    success: true,
    metadata: firstRuinCenter ? { ruinCenter: firstRuinCenter } : undefined,
  };
}

export const RUINS_PHASE = {
  name: 'ruins',
  dependsOn: ['swamps'],
  execute: ruinsPhase,
};
