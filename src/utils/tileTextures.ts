import { Assets, Texture } from 'pixi.js';

import type { TileType } from '../types';
import type { OverlayId } from './overlayConfig';

// Base terrain tiles
import grassUrl from '../assets/tiles/terrain/grass.svg';
import waterUrl from '../assets/tiles/terrain/water.svg';
import roadUrl from '../assets/tiles/terrain/road.svg';
import sandUrl from '../assets/tiles/terrain/sand.svg';
import snowUrl from '../assets/tiles/terrain/snow.svg';
import lavaUrl from '../assets/tiles/terrain/lava.svg';
import swampUrl from '../assets/tiles/terrain/swamp.svg';
import bridgeUrl from '../assets/tiles/terrain/bridge.svg';
import floorUrl from '../assets/tiles/terrain/floor.svg';

// New static tiles - dungeon
import dungeonFloorUrl from '../assets/tiles/terrain/dungeon_floor.svg';
import dungeonWallUrl from '../assets/tiles/terrain/dungeon_wall.svg';
import ruinsUrl from '../assets/tiles/terrain/ruins.svg';
import chasmUrl from '../assets/tiles/terrain/chasm.svg';
import stairsDownUrl from '../assets/tiles/terrain/stairs_down.svg';
import stairsUpUrl from '../assets/tiles/terrain/stairs_up.svg';

// New static tiles - doors and traps
import doorUrl from '../assets/tiles/terrain/door.svg';
import doorOpenUrl from '../assets/tiles/terrain/door_open.svg';
import doorLockedUrl from '../assets/tiles/terrain/door_locked.svg';
import doorSecretUrl from '../assets/tiles/terrain/door_secret.svg';
import trapSpikeUrl from '../assets/tiles/terrain/trap_spike.svg';
import trapPitUrl from '../assets/tiles/terrain/trap_pit.svg';
import pressurePlateUrl from '../assets/tiles/terrain/pressure_plate.svg';

// New static tiles - decoration/debris
import webUrl from '../assets/tiles/terrain/web.svg';
import rubbleUrl from '../assets/tiles/terrain/rubble.svg';
import bonePileUrl from '../assets/tiles/terrain/bone_pile.svg';
import bloodUrl from '../assets/tiles/terrain/blood.svg';
import driedBloodUrl from '../assets/tiles/terrain/dried_blood.svg';
import lichenUrl from '../assets/tiles/terrain/lichen.svg';
import chainUrl from '../assets/tiles/terrain/chain.svg';
import cageUrl from '../assets/tiles/terrain/cage.svg';

// New static tiles - structures
import pillarUrl from '../assets/tiles/terrain/pillar.svg';
import altarDarkUrl from '../assets/tiles/terrain/altar_dark.svg';
import sarcophagusUrl from '../assets/tiles/terrain/sarcophagus.svg';
import crystalUrl from '../assets/tiles/terrain/crystal.svg';

// New static tiles - grass variants
import hillsUrl from '../assets/tiles/terrain/hills.svg';
import flowersUrl from '../assets/tiles/terrain/flowers.svg';
import graveyardUrl from '../assets/tiles/terrain/graveyard.svg';
import blightUrl from '../assets/tiles/terrain/blight.svg';
import cursedGroundUrl from '../assets/tiles/terrain/cursed_ground.svg';
import witheredGrassUrl from '../assets/tiles/terrain/withered_grass.svg';
import charredGroundUrl from '../assets/tiles/terrain/charred_ground.svg';
import witheredFlowersUrl from '../assets/tiles/terrain/withered_flowers.svg';

// New static tiles - environmental
import iceUrl from '../assets/tiles/terrain/ice.svg';
import frozenWaterUrl from '../assets/tiles/terrain/frozen_water.svg';
import saltFlatUrl from '../assets/tiles/terrain/salt_flat.svg';
import deadForestUrl from '../assets/tiles/terrain/dead_forest.svg';
import petrifiedTreeUrl from '../assets/tiles/terrain/petrified_tree.svg';

// Features
import forestUrl from '../assets/tiles/features/forest.svg';
import mountainUrl from '../assets/tiles/features/mountain.svg';
import wallUrl from '../assets/tiles/features/wall.svg';

// Transitions
import waterGrassNUrl from '../assets/tiles/transitions/water_grass_n.svg';
import waterGrassSUrl from '../assets/tiles/transitions/water_grass_s.svg';
import waterGrassEUrl from '../assets/tiles/transitions/water_grass_e.svg';
import waterGrassWUrl from '../assets/tiles/transitions/water_grass_w.svg';
import waterGrassNeUrl from '../assets/tiles/transitions/water_grass_ne.svg';
import waterGrassNwUrl from '../assets/tiles/transitions/water_grass_nw.svg';
import waterGrassSeUrl from '../assets/tiles/transitions/water_grass_se.svg';
import waterGrassSwUrl from '../assets/tiles/transitions/water_grass_sw.svg';

// Connected roads
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

// Overlays
import flowers1Url from '../assets/tiles/overlays/flowers_1.svg';
import flowers2Url from '../assets/tiles/overlays/flowers_2.svg';
import pebbles1Url from '../assets/tiles/overlays/pebbles_1.svg';
import pebbles2Url from '../assets/tiles/overlays/pebbles_2.svg';
import leavesUrl from '../assets/tiles/overlays/leaves.svg';
import tallGrassUrl from '../assets/tiles/overlays/tall_grass.svg';

// Animated tiles - water
import waterFrame0Url from '../assets/tiles/animated/water/frame_0.svg';
import waterFrame1Url from '../assets/tiles/animated/water/frame_1.svg';
import waterFrame2Url from '../assets/tiles/animated/water/frame_2.svg';
import waterFrame3Url from '../assets/tiles/animated/water/frame_3.svg';

// Animated tiles - lava
import lavaFrame0Url from '../assets/tiles/animated/lava/frame_0.svg';
import lavaFrame1Url from '../assets/tiles/animated/lava/frame_1.svg';
import lavaFrame2Url from '../assets/tiles/animated/lava/frame_2.svg';
import lavaFrame3Url from '../assets/tiles/animated/lava/frame_3.svg';

// Animated tiles - swamp
import swampFrame0Url from '../assets/tiles/animated/swamp/frame_0.svg';
import swampFrame1Url from '../assets/tiles/animated/swamp/frame_1.svg';
import swampFrame2Url from '../assets/tiles/animated/swamp/frame_2.svg';
import swampFrame3Url from '../assets/tiles/animated/swamp/frame_3.svg';

// Animated tiles - shallow_water
import shallowWaterFrame0Url from '../assets/tiles/animated/shallow_water/frame_0.svg';
import shallowWaterFrame1Url from '../assets/tiles/animated/shallow_water/frame_1.svg';
import shallowWaterFrame2Url from '../assets/tiles/animated/shallow_water/frame_2.svg';
import shallowWaterFrame3Url from '../assets/tiles/animated/shallow_water/frame_3.svg';

// Animated tiles - deep_water
import deepWaterFrame0Url from '../assets/tiles/animated/deep_water/frame_0.svg';
import deepWaterFrame1Url from '../assets/tiles/animated/deep_water/frame_1.svg';
import deepWaterFrame2Url from '../assets/tiles/animated/deep_water/frame_2.svg';
import deepWaterFrame3Url from '../assets/tiles/animated/deep_water/frame_3.svg';

// Animated tiles - toxic_marsh
import toxicMarshFrame0Url from '../assets/tiles/animated/toxic_marsh/frame_0.svg';
import toxicMarshFrame1Url from '../assets/tiles/animated/toxic_marsh/frame_1.svg';
import toxicMarshFrame2Url from '../assets/tiles/animated/toxic_marsh/frame_2.svg';
import toxicMarshFrame3Url from '../assets/tiles/animated/toxic_marsh/frame_3.svg';

// Animated tiles - miasma
import miasmaFrame0Url from '../assets/tiles/animated/miasma/frame_0.svg';
import miasmaFrame1Url from '../assets/tiles/animated/miasma/frame_1.svg';
import miasmaFrame2Url from '../assets/tiles/animated/miasma/frame_2.svg';
import miasmaFrame3Url from '../assets/tiles/animated/miasma/frame_3.svg';

// Animated tiles - corpse_gas
import corpseGasFrame0Url from '../assets/tiles/animated/corpse_gas/frame_0.svg';
import corpseGasFrame1Url from '../assets/tiles/animated/corpse_gas/frame_1.svg';
import corpseGasFrame2Url from '../assets/tiles/animated/corpse_gas/frame_2.svg';
import corpseGasFrame3Url from '../assets/tiles/animated/corpse_gas/frame_3.svg';

// Animated tiles - wall_torch
import wallTorchFrame0Url from '../assets/tiles/animated/wall_torch/frame_0.svg';
import wallTorchFrame1Url from '../assets/tiles/animated/wall_torch/frame_1.svg';
import wallTorchFrame2Url from '../assets/tiles/animated/wall_torch/frame_2.svg';
import wallTorchFrame3Url from '../assets/tiles/animated/wall_torch/frame_3.svg';

// Animated tiles - brazier
import brazierFrame0Url from '../assets/tiles/animated/brazier/frame_0.svg';
import brazierFrame1Url from '../assets/tiles/animated/brazier/frame_1.svg';
import brazierFrame2Url from '../assets/tiles/animated/brazier/frame_2.svg';
import brazierFrame3Url from '../assets/tiles/animated/brazier/frame_3.svg';

const BASE_TILE_URLS: Partial<Record<TileType, string>> = {
  // Base terrain
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
  // Dungeon tiles
  dungeon_floor: dungeonFloorUrl,
  dungeon_wall: dungeonWallUrl,
  ruins: ruinsUrl,
  chasm: chasmUrl,
  stairs_down: stairsDownUrl,
  stairs_up: stairsUpUrl,
  // Doors and traps
  door: doorUrl,
  door_open: doorOpenUrl,
  door_locked: doorLockedUrl,
  door_secret: doorSecretUrl,
  trap_spike: trapSpikeUrl,
  trap_pit: trapPitUrl,
  pressure_plate: pressurePlateUrl,
  // Decoration/debris
  web: webUrl,
  rubble: rubbleUrl,
  bone_pile: bonePileUrl,
  blood: bloodUrl,
  dried_blood: driedBloodUrl,
  lichen: lichenUrl,
  chain: chainUrl,
  cage: cageUrl,
  // Structures
  pillar: pillarUrl,
  altar_dark: altarDarkUrl,
  sarcophagus: sarcophagusUrl,
  crystal: crystalUrl,
  // Grass variants
  hills: hillsUrl,
  flowers: flowersUrl,
  graveyard: graveyardUrl,
  blight: blightUrl,
  cursed_ground: cursedGroundUrl,
  withered_grass: witheredGrassUrl,
  charred_ground: charredGroundUrl,
  withered_flowers: witheredFlowersUrl,
  // Environmental
  ice: iceUrl,
  frozen_water: frozenWaterUrl,
  salt_flat: saltFlatUrl,
  dead_forest: deadForestUrl,
  petrified_tree: petrifiedTreeUrl,
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

const ANIMATED_TILE_URLS: Partial<Record<TileType, string[]>> = {
  water: [waterFrame0Url, waterFrame1Url, waterFrame2Url, waterFrame3Url],
  lava: [lavaFrame0Url, lavaFrame1Url, lavaFrame2Url, lavaFrame3Url],
  swamp: [swampFrame0Url, swampFrame1Url, swampFrame2Url, swampFrame3Url],
  shallow_water: [shallowWaterFrame0Url, shallowWaterFrame1Url, shallowWaterFrame2Url, shallowWaterFrame3Url],
  deep_water: [deepWaterFrame0Url, deepWaterFrame1Url, deepWaterFrame2Url, deepWaterFrame3Url],
  toxic_marsh: [toxicMarshFrame0Url, toxicMarshFrame1Url, toxicMarshFrame2Url, toxicMarshFrame3Url],
  miasma: [miasmaFrame0Url, miasmaFrame1Url, miasmaFrame2Url, miasmaFrame3Url],
  corpse_gas: [corpseGasFrame0Url, corpseGasFrame1Url, corpseGasFrame2Url, corpseGasFrame3Url],
  wall_torch: [wallTorchFrame0Url, wallTorchFrame1Url, wallTorchFrame2Url, wallTorchFrame3Url],
  brazier: [brazierFrame0Url, brazierFrame1Url, brazierFrame2Url, brazierFrame3Url],
};

const ANIMATED_TILES = new Set<TileType>(Object.keys(ANIMATED_TILE_URLS) as TileType[]);

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
  
  for (const frames of Object.values(ANIMATED_TILE_URLS)) {
    if (frames) urls.push(...frames);
  }
  
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
  const url = BASE_TILE_URLS[tileType];
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

export function isAnimatedTile(tileType: TileType): boolean {
  return ANIMATED_TILES.has(tileType);
}

export function getAnimatedTileTextures(tileType: TileType): Texture[] | null {
  const urls = ANIMATED_TILE_URLS[tileType];
  if (!urls) return null;
  
  const textures: Texture[] = [];
  for (const url of urls) {
    const texture = textureCache.get(url);
    if (texture) {
      textures.push(texture);
    }
  }
  
  return textures.length > 0 ? textures : null;
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
