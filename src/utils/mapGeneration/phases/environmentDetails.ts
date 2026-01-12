import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;
const NO_FEATURE = 0;

export function environmentDetailsPhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  for (let y = 1; y < ctx.height - 1; y++) {
    for (let x = 1; x < ctx.width - 1; x++) {
      const terrain = ctx.getTerrain(x, y);
      const feature = ctx.getFeature(x, y);

      if (feature === T.graveyard && ctx.random() < 0.15) {
        mutator.setFeature(x, y, T.bone_pile);
        continue;
      }

      if (feature === T.ruins) {
        const roll = ctx.random();
        if (roll < 0.2) {
          mutator.setFeature(x, y, T.rubble);
          continue;
        } else if (roll < 0.3) {
          mutator.setFeature(x, y, T.web);
          continue;
        }
      }

      if (terrain === T.swamp && ctx.random() < 0.08) {
        mutator.setTerrain(x, y, T.miasma);
        continue;
      }

      if (feature === T.blight) {
        const roll = ctx.random();
        if (roll < 0.1) {
          mutator.setFeature(x, y, T.cursed_ground);
          continue;
        } else if (roll < 0.25) {
          mutator.setFeature(x, y, T.lichen);
          continue;
        }
      }

      if (terrain === T.grass && feature === NO_FEATURE && ctx.random() < 0.03) {
        mutator.setFeature(x, y, T.flowers);
      }
    }
  }

  return { success: true };
}

export const ENVIRONMENT_DETAILS_PHASE = {
  name: 'environmentDetails',
  dependsOn: ['charredAreas'],
  execute: environmentDetailsPhase,
};
