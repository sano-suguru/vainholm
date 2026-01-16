import type { EnemyTypeId } from '../combat/types';

import skeletonSvg from '../assets/tiles/enemies/skeleton.svg';
import ghostSvg from '../assets/tiles/enemies/ghost.svg';
import cultistSvg from '../assets/tiles/enemies/cultist.svg';

export const ENEMY_TEXTURES: Record<EnemyTypeId, string> = {
  skeleton: skeletonSvg,
  ghost: ghostSvg,
  cultist: cultistSvg,
};

export const getEnemyTexture = (type: EnemyTypeId): string => {
  return ENEMY_TEXTURES[type];
};
