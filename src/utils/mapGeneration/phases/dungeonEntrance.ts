import type { Position } from '../../../types';
import type { PhaseResult, PlacementContext, PlacementMutator } from '../types';
import { Constraints, UNWALKABLE_TERRAINS, BLOCKING_FEATURES } from '../constraints';
import { TILE_ID_BY_TYPE } from '../../../tiles';

const T = TILE_ID_BY_TYPE;

function clearAreaForEntrance(
  ctx: PlacementContext,
  mutator: PlacementMutator,
  position: Position
): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = position.x + dx;
      const y = position.y + dy;
      if (!ctx.isInBounds(x, y)) continue;

      if (UNWALKABLE_TERRAINS.includes(ctx.getTerrain(x, y))) {
        mutator.setTerrain(x, y, T.grass);
      }
      if (BLOCKING_FEATURES.includes(ctx.getFeature(x, y))) {
        mutator.clearFeature(x, y);
      }
    }
  }
}

/**
 * Validates position has walkable terrain in 5x5 area BEFORE placement.
 * Falls back to ruin center with terrain clearing if no valid position found.
 * Dependencies: ruinsPhase (provides 'ruinCenter' metadata)
 */
export function dungeonEntrancePhase(
  ctx: PlacementContext,
  mutator: PlacementMutator
): PhaseResult {
  const ruinCenter = ctx.getMetadata<Position>('ruinCenter');

  if (!ruinCenter) {
    return {
      success: false,
      reason: 'No ruin center available - ruinsPhase must run first',
    };
  }

  const searchConstraints = [
    Constraints.inBounds(2),
    Constraints.areaTerrainWalkable(2),
  ];

  const result = ctx.findValidPosition(
    searchConstraints,
    {
      minX: Math.max(2, ruinCenter.x - 5),
      minY: Math.max(2, ruinCenter.y - 5),
      maxX: Math.min(ctx.width - 3, ruinCenter.x + 5),
      maxY: Math.min(ctx.height - 3, ruinCenter.y + 5),
    },
    50
  );

  let entrancePosition: Position;
  let usedFallback = false;

  if (result.valid) {
    entrancePosition = result.position;
  } else {
    entrancePosition = ruinCenter;
    usedFallback = true;
    clearAreaForEntrance(ctx, mutator, entrancePosition);
  }

  mutator.setFeature(entrancePosition.x, entrancePosition.y, T.dungeon_entrance);
  mutator.setMetadata('dungeonEntrance', entrancePosition);

  return {
    success: true,
    metadata: {
      dungeonEntrance: entrancePosition,
      usedFallback,
    },
  };
}

export const DUNGEON_ENTRANCE_PHASE = {
  name: 'dungeonEntrance',
  dependsOn: ['ruins'],
  execute: dungeonEntrancePhase,
};
