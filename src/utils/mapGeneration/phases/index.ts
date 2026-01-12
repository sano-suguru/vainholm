import type { GenerationPhase } from '../types';
import { RIVER_PHASE } from './river';
import { LAKES_PHASE } from './lakes';
import { ROADS_PHASE } from './roads';
import { SWAMPS_PHASE } from './swamps';
import { RUINS_PHASE } from './ruins';
import { GRAVEYARDS_PHASE } from './graveyards';
import { BLIGHTED_AREAS_PHASE } from './blightedAreas';
import { DEAD_FOREST_PHASE } from './deadForest';
import { TOXIC_MARSHES_PHASE } from './toxicMarshes';
import { CHARRED_AREAS_PHASE } from './charredAreas';
import { ENVIRONMENT_DETAILS_PHASE } from './environmentDetails';
import { DUNGEON_ENTRANCE_PHASE } from './dungeonEntrance';

export const ALL_PHASES: GenerationPhase[] = [
  RIVER_PHASE,
  LAKES_PHASE,
  ROADS_PHASE,
  SWAMPS_PHASE,
  RUINS_PHASE,
  GRAVEYARDS_PHASE,
  BLIGHTED_AREAS_PHASE,
  DEAD_FOREST_PHASE,
  TOXIC_MARSHES_PHASE,
  CHARRED_AREAS_PHASE,
  ENVIRONMENT_DETAILS_PHASE,
  DUNGEON_ENTRANCE_PHASE,
];
