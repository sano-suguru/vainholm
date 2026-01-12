import type { TileId, Position } from '../../types';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PlacementResult {
  valid: boolean;
  position: Position;
  reason?: string;
}

export type PlacementConstraintFn = (
  ctx: PlacementContext,
  x: number,
  y: number
) => boolean;

export interface NamedConstraint {
  name: string;
  check: PlacementConstraintFn;
}

export interface PlacementContext {
  readonly width: number;
  readonly height: number;
  readonly random: () => number;

  isInBounds(x: number, y: number): boolean;
  getTerrain(x: number, y: number): TileId;
  getFeature(x: number, y: number): TileId;

  findValidPosition(
    constraints: NamedConstraint[],
    searchArea?: BoundingBox,
    maxAttempts?: number
  ): PlacementResult;

  canPlace(x: number, y: number, constraints: NamedConstraint[]): boolean;

  getMetadata<T>(key: string): T | undefined;
}

export interface PlacementMutator {
  setTerrain(x: number, y: number, tile: TileId): void;
  setFeature(x: number, y: number, tile: TileId): void;
  clearFeature(x: number, y: number): void;
  setMetadata(key: string, value: unknown): void;
}

export interface PhaseResult {
  success: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export type PhaseExecutor = (
  ctx: PlacementContext,
  mutator: PlacementMutator
) => PhaseResult;

export interface GenerationPhase {
  name: string;
  dependsOn: string[];
  execute: PhaseExecutor;
}

export interface GenerationPipelineResult {
  success: boolean;
  phases: Map<string, PhaseResult>;
  finalMetadata: Record<string, unknown>;
}
