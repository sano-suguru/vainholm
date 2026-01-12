import type { TileId } from '../../types';
import type {
  GenerationPhase,
  GenerationPipelineResult,
  PhaseResult,
} from './types';
import { createPlacementContext } from './PlacementContext';
import { createPlacementMutator } from './PlacementMutator';

interface BiomeLayerData {
  terrain: TileId[][];
  features: TileId[][];
}

function topologicalSort(phases: GenerationPhase[]): GenerationPhase[] | null {
  const phaseMap = new Map<string, GenerationPhase>();
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const phase of phases) {
    phaseMap.set(phase.name, phase);
    inDegree.set(phase.name, 0);
    adjacency.set(phase.name, []);
  }

  for (const phase of phases) {
    for (const dep of phase.dependsOn) {
      if (!phaseMap.has(dep)) {
        return null;
      }
      adjacency.get(dep)!.push(phase.name);
      inDegree.set(phase.name, inDegree.get(phase.name)! + 1);
    }
  }

  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }

  const sorted: GenerationPhase[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(phaseMap.get(current)!);

    for (const dependent of adjacency.get(current)!) {
      const newDegree = inDegree.get(dependent)! - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) queue.push(dependent);
    }
  }

  if (sorted.length !== phases.length) {
    return null;
  }

  return sorted;
}

export function runPipeline(
  phases: GenerationPhase[],
  layers: BiomeLayerData,
  width: number,
  height: number,
  random: () => number
): GenerationPipelineResult {
  const sortedPhases = topologicalSort(phases);

  if (!sortedPhases) {
    return {
      success: false,
      phases: new Map(),
      finalMetadata: {},
    };
  }

  const metadata = new Map<string, unknown>();
  const ctx = createPlacementContext(layers.terrain, layers.features, width, height, random);
  const mutator = createPlacementMutator(layers, metadata);

  const phaseResults = new Map<string, PhaseResult>();

  for (const phase of sortedPhases) {
    const result = phase.execute(ctx, mutator);
    phaseResults.set(phase.name, result);

    if (result.metadata) {
      for (const [key, value] of Object.entries(result.metadata)) {
        metadata.set(key, value);
        ctx.setMetadataInternal(key, value);
      }
    }

    if (!result.success) {
      return {
        success: false,
        phases: phaseResults,
        finalMetadata: Object.fromEntries(metadata),
      };
    }
  }

  return {
    success: true,
    phases: phaseResults,
    finalMetadata: Object.fromEntries(metadata),
  };
}
