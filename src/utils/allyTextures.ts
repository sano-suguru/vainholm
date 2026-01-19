import type { AllyTypeId } from '../combat/types';

import skeletonSvg from '../assets/tiles/enemies/skeleton.svg';
import ghostSvg from '../assets/tiles/enemies/ghost.svg';
import cultistSvg from '../assets/tiles/enemies/cultist.svg';

export const ALLY_TEXTURES: Record<AllyTypeId, string> = {
  skeleton: skeletonSvg,
  ghost: ghostSvg,
  cultist: cultistSvg,
  wraith: ghostSvg,
  shade: ghostSvg,
  hollow_knight: skeletonSvg,
  survivor: cultistSvg,
};

export const getAllyTexture = (type: AllyTypeId): string => {
  return ALLY_TEXTURES[type];
};
