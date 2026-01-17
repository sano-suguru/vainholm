import type { BossTypeId, EnemyTypeId } from '../combat/types';

import skeletonSvg from '../assets/tiles/enemies/skeleton.svg';
import ghostSvg from '../assets/tiles/enemies/ghost.svg';
import cultistSvg from '../assets/tiles/enemies/cultist.svg';
import bossHrodrvardrSvg from '../assets/tiles/enemies/boss_hrodrvardr.svg';
import bossRotgroftrSvg from '../assets/tiles/enemies/boss_rotgroftr.svg';
import bossGleymdkonungrSvg from '../assets/tiles/enemies/boss_gleymdkonungr.svg';
import bossOerslbarnSvg from '../assets/tiles/enemies/boss_oerslbarn.svg';

export const ENEMY_TEXTURES: Record<EnemyTypeId, string> = {
  skeleton: skeletonSvg,
  ghost: ghostSvg,
  cultist: cultistSvg,
  wraith: ghostSvg,
  crawler: skeletonSvg,
  shade: ghostSvg,
  hollow_knight: skeletonSvg,
  blight_spawn: cultistSvg,
  void_worm: cultistSvg,
};

export const BOSS_TEXTURES: Record<BossTypeId, string> = {
  hrodrvardr: bossHrodrvardrSvg,
  rotgroftr: bossRotgroftrSvg,
  gleymdkonungr: bossGleymdkonungrSvg,
  oerslbarn: bossOerslbarnSvg,
};

export const getEnemyTexture = (type: EnemyTypeId): string => {
  return ENEMY_TEXTURES[type];
};

export const getBossTexture = (type: BossTypeId): string => {
  return BOSS_TEXTURES[type];
};
