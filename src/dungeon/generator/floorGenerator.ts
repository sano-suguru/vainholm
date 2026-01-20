import type { MapData, Position, TileId } from '../../types';
import type {
  CollapseConfig,
  Corridor,
  DecorationConfig,
  DoorConfig,
  DungeonFloor,
  FloorGenerationOptions,
  HazardConfig,
  LightingConfig,
  MultiTileConfig,
  MultiTileObject,
  MultiTileObjectDef,
  Room,
  TrapConfig,
  TileWeights,
} from '../types';
import { TILE_ID_BY_TYPE, TILE_MAPPING } from '../../tiles';
import { generateBSP } from './bspGenerator';
import { seededRandom } from '../../utils/seedUtils';

const T = TILE_ID_BY_TYPE;

function getEligibleFeatureRooms(rooms: Room[], minSize = 3): Room[] {
  return rooms.filter(
    (r) =>
      r.roomType !== 'entrance' &&
      r.roomType !== 'exit' &&
      r.roomType !== 'boss' &&
      r.width >= minSize &&
      r.height >= minSize
  );
}

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
  if (corridor.bends && corridor.bends.length > 0) {
    let current = corridor.start;
    for (const bend of corridor.bends) {
      carveLine(terrain, current, bend, corridor.width);
      current = bend;
    }
    carveLine(terrain, current, corridor.end, corridor.width);
  } else if (corridor.bend) {
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

export function selectWeightedTile(
  tiles: TileWeights,
  random: () => number
): TileId | null {
  const entries = Object.entries(tiles);
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [_, w]) => sum + (w ?? 0), 0);
  if (total === 0) return null;

  let roll = random() * total;

  for (const [tileType, weight] of entries) {
    roll -= weight ?? 0;
    if (roll <= 0) {
      const tileId = T[tileType as keyof typeof T];
      return tileId !== undefined ? tileId : null;
    }
  }

  const fallbackTileId = T[entries[0][0] as keyof typeof T];
  return fallbackTileId !== undefined ? fallbackTileId : null;
}

export function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildAdjacencyCount(rooms: Room[], corridors: Corridor[]): Map<number, number> {
  const adjacency = new Map<number, number>();
  for (const room of rooms) {
    adjacency.set(room.id, 0);
  }

  for (const corridor of corridors) {
    for (const room of rooms) {
      const isStart = room.center.x === corridor.start.x && room.center.y === corridor.start.y;
      const isEnd = room.center.x === corridor.end.x && room.center.y === corridor.end.y;
      if (isStart || isEnd) {
        adjacency.set(room.id, (adjacency.get(room.id) ?? 0) + 1);
      }
    }
  }

  return adjacency;
}

function assignRoomTypes(
  rooms: Room[],
  entranceRoom: Room,
  exitRoom: Room | null,
  corridors: Corridor[],
  random: () => number
): void {
  const normalRooms = rooms.filter(
    (r) => r !== entranceRoom && r !== exitRoom
  );

  if (normalRooms.length === 0) return;

  const bossRoom = normalRooms.reduce((largest, room) => {
    const largestArea = largest.width * largest.height;
    const currentArea = room.width * room.height;
    return currentArea > largestArea ? room : largest;
  });
  bossRoom.roomType = 'boss';

  const adjacencyCount = buildAdjacencyCount(rooms, corridors);
  const deadEndRooms = normalRooms.filter(
    (r) => r.roomType !== 'boss' && adjacencyCount.get(r.id) === 1
  );

  if (deadEndRooms.length > 0) {
    const treasureRoom = deadEndRooms[Math.floor(random() * deadEndRooms.length)];
    treasureRoom.roomType = 'treasure';
  }
}

function findDoorPosition(
  room: Room,
  terrain: TileId[][]
): Position | null {
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  for (const { dx, dy } of directions) {
    let x = room.center.x;
    let y = room.center.y;

    while (x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height) {
      x += dx;
      y += dy;
    }

    if (terrain[y]?.[x] === T.dungeon_floor) {
      return { x, y };
    }
  }

  return null;
}

export function validateDoorConfig(config: DoorConfig): void {
  const sum = config.secretChance + config.lockedChance;
  if (sum > 1) {
    throw new Error(
      `Invalid DoorConfig: secretChance (${config.secretChance}) + lockedChance (${config.lockedChance}) = ${sum} exceeds 1`
    );
  }
}

function placeDoors(
  rooms: Room[],
  corridors: Corridor[],
  terrain: TileId[][],
  features: TileId[][],
  random: () => number,
  config?: DoorConfig
): void {
  if (!config) return;
  validateDoorConfig(config);

  const placedPositions = new Set<string>();

  for (const corridor of corridors) {
    const endpoints = [corridor.start, corridor.end];

    for (const point of endpoints) {
      if (random() > config.doorChance) continue;

      const room = rooms.find(
        (r) => r.center.x === point.x && r.center.y === point.y
      );
      if (!room) continue;

      const doorPos = findDoorPosition(room, terrain);
      if (!doorPos) continue;

      const posKey = `${doorPos.x},${doorPos.y}`;
      if (placedPositions.has(posKey)) continue;
      if (features[doorPos.y]?.[doorPos.x] !== 0) continue;

      const roll = random();
      let doorTile: TileId;
      if (roll < config.secretChance) {
        doorTile = T.door_secret;
      } else if (roll < config.secretChance + config.lockedChance) {
        doorTile = T.door_locked;
      } else {
        doorTile = T.door;
      }

      features[doorPos.y][doorPos.x] = doorTile;
      placedPositions.add(posKey);
    }
  }
}

function addDecorations(
  features: TileId[][],
  rooms: Room[],
  random: () => number,
  config?: DecorationConfig
): void {
  const chance = config?.roomDecorationChance ?? 0.3;
  const tiles = config?.decorationTiles ?? { pillar: 0.4, rubble: 0.3, bone_pile: 0.3 };
  const minSize = config?.minRoomSizeForStructures ?? 4;

  for (const room of rooms) {
    if (room.roomType === 'entrance' || room.roomType === 'exit') continue;
    if (room.roomType === 'boss' || room.roomType === 'treasure') continue;
    if (random() > chance) continue;

    const roomTooSmall = room.width < minSize || room.height < minSize;

    const filteredTiles = roomTooSmall
      ? Object.fromEntries(
          Object.entries(tiles).filter(
            ([type]) => type !== 'pillar' && type !== 'altar_dark' && type !== 'sarcophagus'
          )
        )
      : tiles;

    const tile = selectWeightedTile(filteredTiles, random);
    if (!tile) continue;

    const x = room.x + 1 + Math.floor(random() * Math.max(1, room.width - 2));
    const y = room.y + 1 + Math.floor(random() * Math.max(1, room.height - 2));

    if (features[y]?.[x] === 0) {
      features[y][x] = tile;
    }
  }
}

function calculateDistanceMultiplier(
  room: Room,
  entranceRoom: Room,
  maxMultiplier: number
): number {
  const dx = room.center.x - entranceRoom.center.x;
  const dy = room.center.y - entranceRoom.center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const normalizedDistance = Math.min(distance / 50, 1);
  return 1 + normalizedDistance * (maxMultiplier - 1);
}

function addTraps(
  features: TileId[][],
  rooms: Room[],
  entranceRoom: Room,
  random: () => number,
  config?: TrapConfig
): void {
  if (!config) return;

  const useScaling = config.distanceScaling ?? false;
  const maxMultiplier = config.maxDistanceMultiplier ?? 2.0;

  for (const room of rooms) {
    if (room.roomType === 'entrance') continue;

    let effectiveChance = config.trapChance;
    if (useScaling) {
      const multiplier = calculateDistanceMultiplier(room, entranceRoom, maxMultiplier);
      effectiveChance = Math.min(config.trapChance * multiplier, 0.9);
    }

    if (random() > effectiveChance) continue;

    for (let i = 0; i < config.trapsPerRoom; i++) {
      const tile = selectWeightedTile(config.trapTiles, random);
      if (!tile) continue;

      const x = room.x + Math.floor(random() * room.width);
      const y = room.y + Math.floor(random() * room.height);

      if (features[y]?.[x] === 0) {
        features[y][x] = tile;
      }
    }
  }
}

function addLighting(
  features: TileId[][],
  rooms: Room[],
  random: () => number,
  config?: LightingConfig
): void {
  if (!config) return;

  for (const room of rooms) {
    if (random() > config.lightingChance) continue;
    if (room.width < 4 || room.height < 4) continue;

    const corners = [
      { x: room.x + 1, y: room.y + 1 },
      { x: room.x + room.width - 2, y: room.y + 1 },
      { x: room.x + 1, y: room.y + room.height - 2 },
      { x: room.x + room.width - 2, y: room.y + room.height - 2 },
    ];

    const shuffled = shuffleArray(corners, random);
    let placed = 0;

    for (const pos of shuffled) {
      if (placed >= config.lightsPerRoom) break;
      if (features[pos.y]?.[pos.x] !== 0) continue;

      const tile = selectWeightedTile(config.lightingTiles, random);
      if (tile) {
        features[pos.y][pos.x] = tile;
        placed++;
      }
    }
  }
}

function addHazards(
  features: TileId[][],
  terrain: TileId[][],
  rooms: Room[],
  entranceRoom: Room,
  random: () => number,
  config?: HazardConfig
): void {
  if (!config) return;

  const useScaling = config.distanceScaling ?? false;
  const maxMultiplier = config.maxDistanceMultiplier ?? 2.0;

  for (const room of rooms) {
    if (room.roomType === 'entrance') continue;

    let effectiveChance = config.hazardChance;
    if (useScaling) {
      const multiplier = calculateDistanceMultiplier(room, entranceRoom, maxMultiplier);
      effectiveChance = Math.min(config.hazardChance * multiplier, 0.8);
    }

    if (random() > effectiveChance) continue;

    const tile = selectWeightedTile(config.hazardTiles, random);
    if (!tile) continue;

    const startX = room.x + Math.floor(random() * Math.max(1, room.width - 2));
    const startY = room.y + Math.floor(random() * Math.max(1, room.height - 2));
    const size = 1 + Math.floor(random() * 2);

    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const x = startX + dx;
        const y = startY + dy;
        if (terrain[y]?.[x] === T.dungeon_floor && features[y]?.[x] === 0) {
          features[y][x] = tile;
        }
      }
    }
  }
}

function decorateSpecialRooms(
  features: TileId[][],
  rooms: Room[],
  random: () => number
): void {
  for (const room of rooms) {
    if (room.roomType === 'boss') {
      const centerX = room.x + Math.floor(room.width / 2);
      const centerY = room.y + Math.floor(room.height / 2);

      if (features[centerY]?.[centerX] === 0) {
        features[centerY][centerX] = T.altar_dark;
      }

      if (room.width >= 5 && room.height >= 5) {
        const diagonalCorners = [
          { x: room.x + 1, y: room.y + 1 },
          { x: room.x + room.width - 2, y: room.y + room.height - 2 },
        ];
        for (const c of diagonalCorners) {
          if (features[c.y]?.[c.x] === 0) {
            features[c.y][c.x] = T.brazier;
          }
        }
      }
    }

    if (room.roomType === 'treasure') {
      const centerX = room.x + Math.floor(room.width / 2);
      const centerY = room.y + Math.floor(room.height / 2);

      if (features[centerY]?.[centerX] === 0) {
        features[centerY][centerX] = T.sarcophagus;
      }

      for (let i = 0; i < 3; i++) {
        const x = room.x + Math.floor(random() * room.width);
        const y = room.y + Math.floor(random() * room.height);
        if (features[y]?.[x] === 0) {
          features[y][x] = T.bone_pile;
        }
      }
    }
  }
}

/**
 * Places a remnant altar on the last floor of each region.
 * The altar is placed in a room that is not entrance, exit, or boss.
 */
function placeRemnantAltar(
  features: TileId[][],
  rooms: Room[],
  random: () => number
): Position | null {
  const eligibleRooms = rooms.filter(
    (r) =>
      r.roomType !== 'entrance' &&
      r.roomType !== 'exit' &&
      r.roomType !== 'boss' &&
      r.width >= 4 &&
      r.height >= 4
  );

  if (eligibleRooms.length === 0) {
    const fallbackRooms = rooms.filter(
      (r) => r.roomType !== 'entrance' && r.roomType !== 'exit'
    );
    if (fallbackRooms.length === 0) return null;
    eligibleRooms.push(fallbackRooms[Math.floor(random() * fallbackRooms.length)]);
  }

  const room = eligibleRooms[Math.floor(random() * eligibleRooms.length)];
  const centerX = room.x + Math.floor(room.width / 2);
  const centerY = room.y + Math.floor(room.height / 2);

  const offsets = [
    { dx: 0, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (const { dx, dy } of offsets) {
    const x = centerX + dx;
    const y = centerY + dy;
    if (
      x >= room.x &&
      x < room.x + room.width &&
      y >= room.y &&
      y < room.y + room.height &&
      features[y]?.[x] === 0
    ) {
      features[y][x] = T.altar_remnant;
      return { x, y };
    }
  }

  return null;
}

function placeCage(
  features: TileId[][],
  rooms: Room[],
  random: () => number,
  cageChance: number
): Position | null {
  if (random() > cageChance) return null;

  const eligibleRooms = getEligibleFeatureRooms(rooms);

  if (eligibleRooms.length === 0) return null;

  const room = eligibleRooms[Math.floor(random() * eligibleRooms.length)];

  for (let attempts = 0; attempts < 10; attempts++) {
    const x = room.x + 1 + Math.floor(random() * Math.max(1, room.width - 2));
    const y = room.y + 1 + Math.floor(random() * Math.max(1, room.height - 2));

    if (features[y]?.[x] === 0) {
      features[y][x] = T.cage;
      return { x, y };
    }
  }

  return null;
}

function placeWeaponShrine(
  features: TileId[][],
  rooms: Room[],
  random: () => number,
  level: number,
  shrineChance: number
): Position | null {
  // Only spawn on deeper floors (level >= 4)
  if (level < 4) return null;
  if (random() > shrineChance) return null;

  const eligibleRooms = getEligibleFeatureRooms(rooms);

  if (eligibleRooms.length === 0) return null;

  const room = eligibleRooms[Math.floor(random() * eligibleRooms.length)];

  for (let attempts = 0; attempts < 10; attempts++) {
    const x = room.x + 1 + Math.floor(random() * Math.max(1, room.width - 2));
    const y = room.y + 1 + Math.floor(random() * Math.max(1, room.height - 2));

    if (features[y]?.[x] === 0) {
      features[y][x] = T.weapon_shrine;
      return { x, y };
    }
  }

  return null;
}

function selectWeightedObject(
  objects: MultiTileObjectDef[],
  random: () => number
): MultiTileObjectDef | null {
  if (objects.length === 0) return null;
  
  const total = objects.reduce((sum, obj) => sum + obj.weight, 0);
  if (total === 0) return null;
  
  let roll = random() * total;
  for (const obj of objects) {
    roll -= obj.weight;
    if (roll <= 0) return obj;
  }
  return objects[0];
}

function placeMultiTileObjects(
  features: TileId[][],
  rooms: Room[],
  random: () => number,
  config?: MultiTileConfig
): MultiTileObject[] {
  if (!config) return [];
  
  const placed: MultiTileObject[] = [];
  const eligibleRooms = rooms.filter(
    r => r.roomType !== 'entrance' && r.roomType !== 'exit' && r.width >= 4 && r.height >= 4
  );
  
  for (const room of eligibleRooms) {
    if (placed.length >= config.maxObjectsPerFloor) break;
    if (random() > config.objectChance) continue;
    
    const objDef = selectWeightedObject(config.objects, random);
    if (!objDef) continue;
    if (room.width < objDef.width + 2 || room.height < objDef.height + 2) continue;
    
    for (let attempts = 0; attempts < 5; attempts++) {
      const x = room.x + 1 + Math.floor(random() * (room.width - objDef.width - 1));
      const y = room.y + 1 + Math.floor(random() * (room.height - objDef.height - 1));
      
      let canPlace = true;
      for (let dy = 0; dy < objDef.height && canPlace; dy++) {
        for (let dx = 0; dx < objDef.width && canPlace; dx++) {
          if (features[y + dy]?.[x + dx] !== 0) canPlace = false;
        }
      }
      
      if (canPlace) {
        for (let dy = 0; dy < objDef.height; dy++) {
          for (let dx = 0; dx < objDef.width; dx++) {
            features[y + dy][x + dx] = T.multitile_marker;
          }
        }
        
        placed.push({
          id: `${objDef.type}_${x}_${y}`,
          type: objDef.type,
          x,
          y,
          width: objDef.width,
          height: objDef.height,
        });
        break;
      }
    }
  }
  
  return placed;
}

function floodFill(
  terrain: TileId[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): Set<string> {
  const visited = new Set<string>();
  const stack: Position[] = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const pos = stack.pop()!;
    const key = `${pos.x},${pos.y}`;

    if (visited.has(key)) continue;
    if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) continue;

    const tile = terrain[pos.y]?.[pos.x];
    if (tile === T.dungeon_wall || tile === T.collapse_void || tile === undefined) continue;

    visited.add(key);

    stack.push({ x: pos.x + 1, y: pos.y });
    stack.push({ x: pos.x - 1, y: pos.y });
    stack.push({ x: pos.x, y: pos.y + 1 });
    stack.push({ x: pos.x, y: pos.y - 1 });
  }

  return visited;
}

function isPathConnected(
  terrain: TileId[][],
  from: Position,
  to: Position,
  width: number,
  height: number
): boolean {
  const reachable = floodFill(terrain, from.x, from.y, width, height);
  return reachable.has(`${to.x},${to.y}`);
}

function addCollapseZones(
  terrain: TileId[][],
  rooms: Room[],
  entranceRoom: Room,
  exitRoom: Room | null,
  stairsUp: Position | null,
  stairsDown: Position | null,
  random: () => number,
  config: CollapseConfig,
  regionLevel: number,
  width: number,
  height: number
): void {
  const minRoomSize = config.affectWalls ? config.minCollapseSize : config.minCollapseSize + 2;
  const eligibleRooms = rooms.filter(
    (r) =>
      r.roomType !== 'entrance' &&
      r.roomType !== 'exit' &&
      r.roomType !== 'boss' &&
      r.width >= minRoomSize &&
      r.height >= minRoomSize
  );

  if (eligibleRooms.length === 0) return;

  let effectiveChance = config.collapseChance;
  if (config.floorScaling) {
    const multiplier = 1 + (regionLevel - 1) * ((config.maxFloorMultiplier ?? 1.5) - 1) / 2;
    effectiveChance = Math.min(config.collapseChance * multiplier, 0.9);
  }

  const shuffledRooms = shuffleArray(eligibleRooms, random);
  let zonesPlaced = 0;

  for (const room of shuffledRooms) {
    if (zonesPlaced >= config.maxCollapseZones) break;
    if (random() > effectiveChance) continue;

    const collapseWidth =
      config.minCollapseSize +
      Math.floor(random() * (config.maxCollapseSize - config.minCollapseSize + 1));
    const collapseHeight =
      config.minCollapseSize +
      Math.floor(random() * (config.maxCollapseSize - config.minCollapseSize + 1));

    const margin = config.affectWalls ? 0 : 1;
    const maxStartX = room.x + room.width - collapseWidth - margin;
    const maxStartY = room.y + room.height - collapseHeight - margin;

    if (maxStartX <= room.x + margin || maxStartY <= room.y + margin) continue;

    const collapseX = room.x + margin + Math.floor(random() * (maxStartX - room.x - margin));
    const collapseY = room.y + margin + Math.floor(random() * (maxStartY - room.y - margin));

    const terrainBackup: TileId[][] = terrain.map((row) => [...row]);

    const centerX = collapseX + collapseWidth / 2;
    const centerY = collapseY + collapseHeight / 2;
    const maxRadius = Math.min(collapseWidth, collapseHeight) / 2;

    const collapsedTiles: Position[] = [];

    const innerRadiusRatio = 0.6;
    const scanMargin = config.affectWalls ? 2 : 1;

    for (let dy = -scanMargin; dy <= collapseHeight + scanMargin - 1; dy++) {
      for (let dx = -scanMargin; dx <= collapseWidth + scanMargin - 1; dx++) {
        const x = collapseX + dx;
        const y = collapseY + dy;

        const tile = terrain[y]?.[x];
        const isFloor = tile === T.dungeon_floor;
        const isWall = tile === T.dungeon_wall;

        if (!isFloor && !(config.affectWalls && isWall)) continue;

        const distX = x - centerX;
        const distY = y - centerY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        const noise = (random() - 0.5) * maxRadius * 0.8;
        const effectiveRadius = maxRadius + noise;

        if (distance <= effectiveRadius) {
          const innerRadius = effectiveRadius * innerRadiusRatio;

          if (isWall && distance > innerRadius) {
            terrain[y][x] = T.rubble;
          } else {
            terrain[y][x] = T.collapse_void;
          }
          collapsedTiles.push({ x, y });
        }
      }
    }

    if (collapsedTiles.length < 4) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          terrain[y][x] = terrainBackup[y][x];
        }
      }
      continue;
    }

    const startPos = stairsUp ?? entranceRoom.center;
    const endPos = stairsDown ?? (exitRoom?.center ?? startPos);

    if (!isPathConnected(terrain, startPos, endPos, width, height)) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          terrain[y][x] = terrainBackup[y][x];
        }
      }
      continue;
    }

    for (const pos of collapsedTiles) {
      for (let dy = -config.crackedFloorRadius; dy <= config.crackedFloorRadius; dy++) {
        for (let dx = -config.crackedFloorRadius; dx <= config.crackedFloorRadius; dx++) {
          const x = pos.x + dx;
          const y = pos.y + dy;

          if (terrain[y]?.[x] === T.dungeon_floor) {
            terrain[y][x] = T.cracked_floor;
          }
        }
      }
    }

    zonesPlaced++;
  }
}

function getFloorSize(options: FloorGenerationOptions): { width: number; height: number } {
  const { regionConfig, regionLevel } = options;

  if (regionConfig.size.perFloor && regionConfig.size.perFloor[regionLevel]) {
    return regionConfig.size.perFloor[regionLevel];
  }

  return regionConfig.size.base;
}

export function generateFloor(options: FloorGenerationOptions): DungeonFloor {
  const {
    level,
    regionConfig,
    seed,
    previousStairsDown,
    isLastFloorInDungeon,
    regionLevel,
    floorsPerRegion,
  } = options;
  const random = seededRandom(seed);

  const { width, height } = getFloorSize(options);

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

  let exitRoom: Room | null = null;
  if (!isLastFloorInDungeon) {
    exitRoom = findFarthestRoom(rooms, entranceRoom.center);
    exitRoom.roomType = 'exit';
    stairsDown = { ...exitRoom.center };
    features[stairsDown.y][stairsDown.x] = T.stairs_down;
  }

  assignRoomTypes(rooms, entranceRoom, exitRoom, corridors, random);

  if (regionConfig.collapseConfig) {
    addCollapseZones(
      terrain,
      rooms,
      entranceRoom,
      exitRoom,
      stairsUp,
      stairsDown,
      random,
      regionConfig.collapseConfig,
      regionLevel,
      width,
      height
    );
  }

  placeDoors(rooms, corridors, terrain, features, random, regionConfig.doorConfig);

  decorateSpecialRooms(features, rooms, random);

  addDecorations(features, rooms, random, regionConfig.decorationConfig);

  addTraps(features, rooms, entranceRoom, random, regionConfig.trapConfig);

  addLighting(features, rooms, random, regionConfig.lightingConfig);

  addHazards(features, terrain, rooms, entranceRoom, random, regionConfig.hazardConfig);

  const isLastFloorInRegion = regionLevel === floorsPerRegion;
  if (isLastFloorInRegion) {
    placeRemnantAltar(features, rooms, random);
  }

  placeCage(features, rooms, random, 0.15);
  placeWeaponShrine(features, rooms, random, level, 0.15);

  const multiTileObjects = placeMultiTileObjects(features, rooms, random, regionConfig.multiTileConfig);

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
    multiTileObjects,
    visited: false,
    seed,
  };
}
