import { Assets, Texture } from 'pixi.js';

import type { TileType } from '../types';
import type { OverlayId } from './overlayConfig';

import grassUrl from '../assets/tiles/terrain/grass.svg';
import waterUrl from '../assets/tiles/terrain/water.svg';
import roadUrl from '../assets/tiles/terrain/road.svg';
import sandUrl from '../assets/tiles/terrain/sand.svg';
import snowUrl from '../assets/tiles/terrain/snow.svg';
import lavaUrl from '../assets/tiles/terrain/lava.svg';
import swampUrl from '../assets/tiles/terrain/swamp.svg';
import bridgeUrl from '../assets/tiles/terrain/bridge.svg';
import floorUrl from '../assets/tiles/terrain/floor.svg';

import forestUrl from '../assets/tiles/features/forest.svg';
import mountainUrl from '../assets/tiles/features/mountain.svg';
import wallUrl from '../assets/tiles/features/wall.svg';

import waterGrassNUrl from '../assets/tiles/transitions/water_grass_n.svg';
import waterGrassSUrl from '../assets/tiles/transitions/water_grass_s.svg';
import waterGrassEUrl from '../assets/tiles/transitions/water_grass_e.svg';
import waterGrassWUrl from '../assets/tiles/transitions/water_grass_w.svg';
import waterGrassNeUrl from '../assets/tiles/transitions/water_grass_ne.svg';
import waterGrassNwUrl from '../assets/tiles/transitions/water_grass_nw.svg';
import waterGrassSeUrl from '../assets/tiles/transitions/water_grass_se.svg';
import waterGrassSwUrl from '../assets/tiles/transitions/water_grass_sw.svg';

import roadVUrl from '../assets/tiles/connected/road_v.svg';
import roadHUrl from '../assets/tiles/connected/road_h.svg';
import roadCrossUrl from '../assets/tiles/connected/road_cross.svg';
import roadCornerNeUrl from '../assets/tiles/connected/road_corner_ne.svg';
import roadCornerNwUrl from '../assets/tiles/connected/road_corner_nw.svg';
import roadCornerSeUrl from '../assets/tiles/connected/road_corner_se.svg';
import roadCornerSwUrl from '../assets/tiles/connected/road_corner_sw.svg';
import roadTNUrl from '../assets/tiles/connected/road_t_n.svg';
import roadTSUrl from '../assets/tiles/connected/road_t_s.svg';
import roadTEUrl from '../assets/tiles/connected/road_t_e.svg';
import roadTWUrl from '../assets/tiles/connected/road_t_w.svg';
import roadEndNUrl from '../assets/tiles/connected/road_end_n.svg';
import roadEndSUrl from '../assets/tiles/connected/road_end_s.svg';
import roadEndEUrl from '../assets/tiles/connected/road_end_e.svg';
import roadEndWUrl from '../assets/tiles/connected/road_end_w.svg';

import flowers1Url from '../assets/tiles/overlays/flowers_1.svg';
import flowers2Url from '../assets/tiles/overlays/flowers_2.svg';
import pebbles1Url from '../assets/tiles/overlays/pebbles_1.svg';
import pebbles2Url from '../assets/tiles/overlays/pebbles_2.svg';
import leavesUrl from '../assets/tiles/overlays/leaves.svg';
import tallGrassUrl from '../assets/tiles/overlays/tall_grass.svg';

const BASE_TILE_URLS: Partial<Record<TileType, string>> = {
  grass: grassUrl,
  water: waterUrl,
  forest: forestUrl,
  wall: wallUrl,
  road: roadUrl,
  sand: sandUrl,
  mountain: mountainUrl,
  snow: snowUrl,
  lava: lavaUrl,
  swamp: swampUrl,
  bridge: bridgeUrl,
  floor: floorUrl,
};

const TILE_FALLBACKS: Partial<Record<TileType, TileType>> = {
  shallow_water: 'water',
  deep_water: 'water',
  hills: 'grass',
  dungeon_floor: 'floor',
  dungeon_wall: 'wall',
  ice: 'snow',
  frozen_water: 'snow',
  flowers: 'grass',
  ruins: 'floor',
  graveyard: 'grass',
  blight: 'grass',
  chasm: 'floor',
  stairs_down: 'floor',
  stairs_up: 'floor',
  door: 'wall',
  door_open: 'floor',
  door_locked: 'wall',
  door_secret: 'wall',
  trap_spike: 'floor',
  trap_pit: 'floor',
  pressure_plate: 'floor',
  web: 'floor',
  rubble: 'floor',
  bone_pile: 'floor',
  blood: 'floor',
  dried_blood: 'floor',
  wall_torch: 'wall',
  brazier: 'floor',
  miasma: 'swamp',
  corpse_gas: 'swamp',
  cursed_ground: 'grass',
  lichen: 'floor',
  altar_dark: 'floor',
  sarcophagus: 'floor',
  pillar: 'wall',
  chain: 'floor',
  cage: 'floor',
  crystal: 'floor',
  dead_forest: 'forest',
  withered_grass: 'grass',
  toxic_marsh: 'swamp',
  charred_ground: 'grass',
  salt_flat: 'sand',
  petrified_tree: 'forest',
  withered_flowers: 'grass',
};

type TransitionDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const TRANSITION_URLS: Record<string, Record<TransitionDirection, string>> = {
  water_grass: {
    n: waterGrassNUrl,
    s: waterGrassSUrl,
    e: waterGrassEUrl,
    w: waterGrassWUrl,
    ne: waterGrassNeUrl,
    nw: waterGrassNwUrl,
    se: waterGrassSeUrl,
    sw: waterGrassSwUrl,
  },
};

type ConnectionType = 'v' | 'h' | 'cross' | 'corner_ne' | 'corner_nw' | 'corner_se' | 'corner_sw' | 
  't_n' | 't_s' | 't_e' | 't_w' | 'end_n' | 'end_s' | 'end_e' | 'end_w';

const CONNECTED_URLS: Record<string, Record<ConnectionType, string>> = {
  road: {
    v: roadVUrl,
    h: roadHUrl,
    cross: roadCrossUrl,
    corner_ne: roadCornerNeUrl,
    corner_nw: roadCornerNwUrl,
    corner_se: roadCornerSeUrl,
    corner_sw: roadCornerSwUrl,
    t_n: roadTNUrl,
    t_s: roadTSUrl,
    t_e: roadTEUrl,
    t_w: roadTWUrl,
    end_n: roadEndNUrl,
    end_s: roadEndSUrl,
    end_e: roadEndEUrl,
    end_w: roadEndWUrl,
  },
};

const OVERLAY_URLS: Record<OverlayId, string> = {
  flowers_1: flowers1Url,
  flowers_2: flowers2Url,
  pebbles_1: pebbles1Url,
  pebbles_2: pebbles2Url,
  leaves: leavesUrl,
  tall_grass: tallGrassUrl,
};

export type OverlayType = OverlayId;

const textureCache = new Map<string, Texture>();
let texturesLoaded = false;
let loadingPromise: Promise<void> | null = null;

function getAllTextureUrls(): string[] {
  const urls: string[] = [];
  
  for (const url of Object.values(BASE_TILE_URLS)) {
    if (url) urls.push(url);
  }
  
  for (const transitions of Object.values(TRANSITION_URLS)) {
    urls.push(...Object.values(transitions));
  }
  
  for (const connections of Object.values(CONNECTED_URLS)) {
    urls.push(...Object.values(connections));
  }
  
  urls.push(...Object.values(OVERLAY_URLS));
  
  return urls;
}

export async function loadTileTextures(): Promise<void> {
  if (texturesLoaded) return;
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = (async () => {
    const urls = getAllTextureUrls();
    
    const loadPromises = urls.map(async (url) => {
      try {
        const texture = await Assets.load<Texture>(url);
        textureCache.set(url, texture);
      } catch (error) {
        console.warn(`Failed to load texture: ${url}`, error);
      }
    });
    
    await Promise.all(loadPromises);
    texturesLoaded = true;
  })();
  
  return loadingPromise;
}

export function getBaseTileTexture(tileType: TileType): Texture | null {
  let url = BASE_TILE_URLS[tileType];
  
  if (!url) {
    const fallback = TILE_FALLBACKS[tileType];
    if (fallback) {
      url = BASE_TILE_URLS[fallback];
    }
  }
  
  if (!url) return null;
  return textureCache.get(url) || null;
}

export function getTransitionTexture(
  fromType: TileType, 
  toType: TileType, 
  direction: TransitionDirection
): Texture | null {
  const key = `${fromType}_${toType}`;
  const transitions = TRANSITION_URLS[key];
  if (!transitions) return null;
  
  const url = transitions[direction];
  if (!url) return null;
  
  return textureCache.get(url) || null;
}

export function getConnectedTileTexture(
  tileType: TileType,
  connectionType: ConnectionType
): Texture | null {
  const connections = CONNECTED_URLS[tileType];
  if (!connections) return null;
  
  const url = connections[connectionType];
  if (!url) return null;
  
  return textureCache.get(url) || null;
}

export function getOverlayTexture(overlayType: OverlayType): Texture | null {
  const url = OVERLAY_URLS[overlayType];
  return textureCache.get(url) || null;
}

export function getConnectionType(neighbors: {
  n: boolean;
  s: boolean;
  e: boolean;
  w: boolean;
}): ConnectionType {
  const { n, s, e, w } = neighbors;
  const count = [n, s, e, w].filter(Boolean).length;
  
  if (count === 4) return 'cross';
  
  if (count === 3) {
    if (!n) return 't_s';
    if (!s) return 't_n';
    if (!e) return 't_w';
    if (!w) return 't_e';
  }
  
  if (count === 2) {
    if (n && s) return 'v';
    if (e && w) return 'h';
    if (n && e) return 'corner_ne';
    if (n && w) return 'corner_nw';
    if (s && e) return 'corner_se';
    if (s && w) return 'corner_sw';
  }
  
  if (count === 1) {
    if (n) return 'end_s';
    if (s) return 'end_n';
    if (e) return 'end_w';
    if (w) return 'end_e';
  }
  
  return 'v';
}

const GRASS_LIKE_TILES = new Set<TileType>(['grass', 'flowers', 'withered_grass', 'cursed_ground']);

export function getTransitionDirections(neighbors: {
  n: TileType | null;
  s: TileType | null;
  e: TileType | null;
  w: TileType | null;
  ne: TileType | null;
  nw: TileType | null;
  se: TileType | null;
  sw: TileType | null;
}): TransitionDirection[] {
  const directions: TransitionDirection[] = [];
  
  if (neighbors.n && GRASS_LIKE_TILES.has(neighbors.n)) directions.push('n');
  if (neighbors.s && GRASS_LIKE_TILES.has(neighbors.s)) directions.push('s');
  if (neighbors.e && GRASS_LIKE_TILES.has(neighbors.e)) directions.push('e');
  if (neighbors.w && GRASS_LIKE_TILES.has(neighbors.w)) directions.push('w');
  
  if (neighbors.ne && GRASS_LIKE_TILES.has(neighbors.ne) && 
      !directions.includes('n') && !directions.includes('e')) {
    directions.push('ne');
  }
  if (neighbors.nw && GRASS_LIKE_TILES.has(neighbors.nw) && 
      !directions.includes('n') && !directions.includes('w')) {
    directions.push('nw');
  }
  if (neighbors.se && GRASS_LIKE_TILES.has(neighbors.se) && 
      !directions.includes('s') && !directions.includes('e')) {
    directions.push('se');
  }
  if (neighbors.sw && GRASS_LIKE_TILES.has(neighbors.sw) && 
      !directions.includes('s') && !directions.includes('w')) {
    directions.push('sw');
  }
  
  return directions;
}

export type { TransitionDirection };
