import type { MapData, Position, TileId } from '../../types';
import type { Corridor, DungeonFloor, FloorGenerationOptions, Room } from '../types';
import { TILE_ID_BY_TYPE, TILE_MAPPING } from '../../tiles';
import { generateBSP } from './bspGenerator';
import { seededRandom } from '../../utils/seedUtils';

const T = TILE_ID_BY_TYPE;

function createEmptyGrid(width: number, height: number, fillTile: TileId): TileId[][] {
  const grid: TileId[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(fillTile));
  }
  return grid;
}

function carveRoom(terrain: TileId[][], room: Room): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (terrain[y] && terrain[y][x] !== undefined) {
        terrain[y][x] = T.dungeon_floor;
      }
    }
  }
}

function carveLine(
  terrain: TileId[][],
  from: Position,
  to: Position,
  width: number
): void {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);

  let x = from.x;
  let y = from.y;

  const halfWidth = Math.floor(width / 2);

  while (x !== to.x || y !== to.y) {
    for (let offsetY = -halfWidth; offsetY <= halfWidth; offsetY++) {
      for (let offsetX = -halfWidth; offsetX <= halfWidth; offsetX++) {
        const carveY = y + offsetY;
        const carveX = x + offsetX;
        if (terrain[carveY] && terrain[carveY][carveX] !== undefined) {
          terrain[carveY][carveX] = T.dungeon_floor;
        }
      }
    }

    if (x !== to.x) x += dx;
    else if (y !== to.y) y += dy;
  }

  for (let offsetY = -halfWidth; offsetY <= halfWidth; offsetY++) {
    for (let offsetX = -halfWidth; offsetX <= halfWidth; offsetX++) {
      const carveY = to.y + offsetY;
      const carveX = to.x + offsetX;
      if (terrain[carveY] && terrain[carveY][carveX] !== undefined) {
        terrain[carveY][carveX] = T.dungeon_floor;
      }
    }
  }
}

function carveCorridor(terrain: TileId[][], corridor: Corridor): void {
  if (corridor.bend) {
    carveLine(terrain, corridor.start, corridor.bend, corridor.width);
    carveLine(terrain, corridor.bend, corridor.end, corridor.width);
  } else {
    carveLine(terrain, corridor.start, corridor.end, corridor.width);
  }
}

function findFarthestRoom(rooms: Room[], fromPosition: Position): Room {
  let farthestRoom = rooms[0];
  let maxDistance = 0;

  for (const room of rooms) {
    const dx = room.center.x - fromPosition.x;
    const dy = room.center.y - fromPosition.y;
    const distance = dx * dx + dy * dy;

    if (distance > maxDistance) {
      maxDistance = distance;
      farthestRoom = room;
    }
  }

  return farthestRoom;
}

function addDecorations(
  features: TileId[][],
  rooms: Room[],
  random: () => number
): void {
  for (const room of rooms) {
    if (room.roomType === 'entrance' || room.roomType === 'exit') {
      continue;
    }

    const decorationChance = 0.3;
    if (random() > decorationChance) continue;

    const decorationType = random();

    const canPlacePillar = room.width > 3 && room.height > 3;

    if (decorationType < 0.4 && canPlacePillar) {
      const pillarX = room.x + 1 + Math.floor(random() * (room.width - 2));
      const pillarY = room.y + 1 + Math.floor(random() * (room.height - 2));
      if (features[pillarY] && features[pillarY][pillarX] !== undefined) {
        features[pillarY][pillarX] = T.pillar;
      }
    } else if (decorationType < 0.7 || !canPlacePillar) {
      const rubbleX = room.x + Math.floor(random() * room.width);
      const rubbleY = room.y + Math.floor(random() * room.height);
      if (features[rubbleY] && features[rubbleY][rubbleX] !== undefined) {
        features[rubbleY][rubbleX] = T.rubble;
      }
    } else {
      const boneX = room.x + Math.floor(random() * room.width);
      const boneY = room.y + Math.floor(random() * room.height);
      if (features[boneY] && features[boneY][boneX] !== undefined) {
        features[boneY][boneX] = T.bone_pile;
      }
    }
  }
}

function getFloorSize(options: FloorGenerationOptions): { width: number; height: number } {
  const { regionConfig, level } = options;
  const regionLevel = level - regionConfig.startFloor + 1;

  if (regionConfig.size.perFloor && regionConfig.size.perFloor[regionLevel]) {
    return regionConfig.size.perFloor[regionLevel];
  }

  return regionConfig.size.base;
}

export function generateFloor(options: FloorGenerationOptions): DungeonFloor {
  const { level, regionConfig, seed, previousStairsDown, isLastFloorInDungeon } = options;
  const random = seededRandom(seed);

  const { width, height } = getFloorSize(options);
  const regionLevel = level - regionConfig.startFloor + 1;

  const bspResult = generateBSP(width, height, seed, regionConfig.bspConfig);
  const { rooms, corridors } = bspResult;

  if (rooms.length === 0) {
    throw new Error(`Failed to generate rooms for floor ${level}`);
  }

  const terrain = createEmptyGrid(width, height, T.dungeon_wall);
  const features = createEmptyGrid(width, height, 0);

  for (const room of rooms) {
    carveRoom(terrain, room);
  }

  for (const corridor of corridors) {
    carveCorridor(terrain, corridor);
  }

  let stairsUp: Position | null = null;
  let stairsDown: Position | null = null;

  let entranceRoom: Room;
  if (previousStairsDown) {
    entranceRoom = rooms.reduce((closest, room) => {
      const currentDist =
        Math.abs(room.center.x - previousStairsDown.x) +
        Math.abs(room.center.y - previousStairsDown.y);
      const closestDist =
        Math.abs(closest.center.x - previousStairsDown.x) +
        Math.abs(closest.center.y - previousStairsDown.y);
      return currentDist < closestDist ? room : closest;
    });

    stairsUp = { ...entranceRoom.center };
    entranceRoom.roomType = 'entrance';
    features[stairsUp.y][stairsUp.x] = T.stairs_up;
  } else {
    entranceRoom = rooms[Math.floor(random() * rooms.length)];
    entranceRoom.roomType = 'entrance';
    stairsUp = { ...entranceRoom.center };
    features[stairsUp.y][stairsUp.x] = T.dungeon_exit;
  }

  if (!isLastFloorInDungeon) {
    const exitRoom = findFarthestRoom(rooms, entranceRoom.center);
    exitRoom.roomType = 'exit';
    stairsDown = { ...exitRoom.center };
    features[stairsDown.y][stairsDown.x] = T.stairs_down;
  }

  addDecorations(features, rooms, random);

  const spawnPoint = stairsUp || entranceRoom.center;

  const map: MapData = {
    name: `${regionConfig.displayName} ${regionLevel}F`,
    width,
    height,
    tileSize: 32,
    layers: [
      { name: 'terrain', data: terrain },
      { name: 'features', data: features },
    ],
    tileMapping: TILE_MAPPING,
    spawnPoint,
  };

  return {
    level,
    regionLevel,
    theme: regionConfig.theme,
    map,
    stairsUp,
    stairsDown,
    rooms,
    corridors,
    visited: false,
    seed,
  };
}
