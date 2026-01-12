import type { BSPConfig, BSPNode, BSPResult, Corridor, Room } from '../types';
import type { Position } from '../../types';
import { seededRandom } from '../../utils/seedUtils';

function getMinSplitSize(config: BSPConfig): number {
  return config.minRoomSize + config.roomMargin * 2 + 2;
}

function splitNode(
  node: BSPNode,
  config: BSPConfig,
  random: () => number
): boolean {
  if (node.left || node.right) {
    return false;
  }

  const minSplitSize = getMinSplitSize(config);

  const canSplitHorizontal = node.height >= minSplitSize * 2;
  const canSplitVertical = node.width >= minSplitSize * 2;

  if (!canSplitHorizontal && !canSplitVertical) {
    return false;
  }

  let splitHorizontal: boolean;
  if (!canSplitHorizontal) {
    splitHorizontal = false;
  } else if (!canSplitVertical) {
    splitHorizontal = true;
  } else {
    splitHorizontal = random() > 0.5;
  }

  const maxSize = (splitHorizontal ? node.height : node.width) - minSplitSize;
  if (maxSize <= minSplitSize) {
    return false;
  }

  const splitPos = Math.floor(minSplitSize + random() * (maxSize - minSplitSize));

  if (splitHorizontal) {
    node.left = {
      x: node.x,
      y: node.y,
      width: node.width,
      height: splitPos,
    };
    node.right = {
      x: node.x,
      y: node.y + splitPos,
      width: node.width,
      height: node.height - splitPos,
    };
  } else {
    node.left = {
      x: node.x,
      y: node.y,
      width: splitPos,
      height: node.height,
    };
    node.right = {
      x: node.x + splitPos,
      y: node.y,
      width: node.width - splitPos,
      height: node.height,
    };
  }

  return true;
}

function createRoom(
  node: BSPNode,
  config: BSPConfig,
  random: () => number,
  roomId: number
): Room | undefined {
  const margin = config.roomMargin;
  const minSize = config.minRoomSize;
  const maxSize = config.maxRoomSize;

  const availableWidth = node.width - margin * 2;
  const availableHeight = node.height - margin * 2;

  if (availableWidth < minSize || availableHeight < minSize) {
    return undefined;
  }

  const roomWidth = Math.min(
    maxSize,
    Math.floor(minSize + random() * (availableWidth - minSize))
  );
  const roomHeight = Math.min(
    maxSize,
    Math.floor(minSize + random() * (availableHeight - minSize))
  );

  const roomX = node.x + margin + Math.floor(random() * (availableWidth - roomWidth));
  const roomY = node.y + margin + Math.floor(random() * (availableHeight - roomHeight));

  return {
    id: roomId,
    x: roomX,
    y: roomY,
    width: roomWidth,
    height: roomHeight,
    center: {
      x: Math.floor(roomX + roomWidth / 2),
      y: Math.floor(roomY + roomHeight / 2),
    },
  };
}

function getLeafNodes(node: BSPNode): BSPNode[] {
  if (!node.left && !node.right) {
    return [node];
  }
  const leaves: BSPNode[] = [];
  if (node.left) {
    leaves.push(...getLeafNodes(node.left));
  }
  if (node.right) {
    leaves.push(...getLeafNodes(node.right));
  }
  return leaves;
}

function findRoomInNode(node: BSPNode): Room | undefined {
  if (node.room) {
    return node.room;
  }
  if (node.left) {
    const leftRoom = findRoomInNode(node.left);
    if (leftRoom) return leftRoom;
  }
  if (node.right) {
    const rightRoom = findRoomInNode(node.right);
    if (rightRoom) return rightRoom;
  }
  return undefined;
}

function createCorridor(
  room1: Room,
  room2: Room,
  config: BSPConfig,
  random: () => number
): Corridor {
  const start = room1.center;
  const end = room2.center;

  // Always use L-shaped corridors to ensure proper connectivity
  // (straight diagonal lines don't carve properly)
  const bend: Position = random() > 0.5
    ? { x: end.x, y: start.y }
    : { x: start.x, y: end.y };

  return {
    start,
    end,
    width: config.corridorWidth,
    bend,
  };
}

function connectNodes(
  node: BSPNode,
  config: BSPConfig,
  random: () => number,
  corridors: Corridor[]
): void {
  if (!node.left || !node.right) {
    return;
  }

  connectNodes(node.left, config, random, corridors);
  connectNodes(node.right, config, random, corridors);

  const leftRoom = findRoomInNode(node.left);
  const rightRoom = findRoomInNode(node.right);

  if (leftRoom && rightRoom) {
    corridors.push(createCorridor(leftRoom, rightRoom, config, random));
  }
}

// Union-Find data structure for connectivity validation
class UnionFind {
  private parent: Map<number, number>;

  constructor(roomIds: number[]) {
    this.parent = new Map();
    for (const id of roomIds) {
      this.parent.set(id, id);
    }
  }

  find(x: number): number {
    const p = this.parent.get(x);
    if (p === undefined) return x;
    if (p !== x) {
      this.parent.set(x, this.find(p));
    }
    return this.parent.get(x)!;
  }

  union(x: number, y: number): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX !== rootY) {
      this.parent.set(rootX, rootY);
    }
  }

  getComponents(): number[][] {
    const components = new Map<number, number[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      if (!components.has(root)) {
        components.set(root, []);
      }
      components.get(root)!.push(id);
    }
    return Array.from(components.values());
  }
}

function buildRoomAdjacency(
  rooms: Room[],
  corridors: Corridor[]
): Map<number, Set<number>> {
  const adjacency = new Map<number, Set<number>>();
  for (const room of rooms) {
    adjacency.set(room.id, new Set());
  }

  for (const corridor of corridors) {
    let room1: Room | undefined;
    let room2: Room | undefined;

    for (const room of rooms) {
      const isStart = room.center.x === corridor.start.x && room.center.y === corridor.start.y;
      const isEnd = room.center.x === corridor.end.x && room.center.y === corridor.end.y;
      if (isStart) room1 = room;
      if (isEnd) room2 = room;
    }

    if (room1 && room2 && room1.id !== room2.id) {
      adjacency.get(room1.id)!.add(room2.id);
      adjacency.get(room2.id)!.add(room1.id);
    }
  }

  return adjacency;
}

function ensureConnectivity(
  rooms: Room[],
  corridors: Corridor[],
  config: BSPConfig,
  random: () => number
): void {
  if (rooms.length <= 1) return;

  const adjacency = buildRoomAdjacency(rooms, corridors);
  const uf = new UnionFind(rooms.map((r) => r.id));

  for (const [roomId, neighbors] of adjacency) {
    for (const neighborId of neighbors) {
      uf.union(roomId, neighborId);
    }
  }

  const components = uf.getComponents();
  if (components.length <= 1) return;

  const roomById = new Map(rooms.map((r) => [r.id, r]));

  for (let i = 1; i < components.length; i++) {
    const room1 = roomById.get(components[0][0])!;
    const room2 = roomById.get(components[i][0])!;

    corridors.push(createCorridor(room1, room2, config, random));
    uf.union(room1.id, room2.id);
  }
}

export function generateBSP(
  width: number,
  height: number,
  seed: number,
  config: BSPConfig
): BSPResult {
  const random = seededRandom(seed);

  const root: BSPNode = {
    x: 0,
    y: 0,
    width,
    height,
  };

  const nodesToSplit: BSPNode[] = [root];
  const targetSplits = Math.ceil(Math.log2(config.maxRooms)) + 1;

  for (let i = 0; i < targetSplits; i++) {
    const currentNodes = [...nodesToSplit];
    nodesToSplit.length = 0;

    for (const node of currentNodes) {
      if (splitNode(node, config, random)) {
        if (node.left) nodesToSplit.push(node.left);
        if (node.right) nodesToSplit.push(node.right);
      }
    }

    if (nodesToSplit.length === 0) break;
  }

  const leaves = getLeafNodes(root);
  const rooms: Room[] = [];
  let roomId = 0;

  for (const leaf of leaves) {
    if (rooms.length >= config.maxRooms) break;

    const room = createRoom(leaf, config, random, roomId);
    if (room) {
      leaf.room = room;
      rooms.push(room);
      roomId++;
    }
  }

  while (rooms.length < config.minRooms && roomId < leaves.length * 2) {
    const leaf = leaves[roomId % leaves.length];
    if (!leaf.room) {
      const room = createRoom(leaf, config, random, roomId);
      if (room) {
        leaf.room = room;
        rooms.push(room);
      }
    }
    roomId++;
  }

  const corridors: Corridor[] = [];
  connectNodes(root, config, random, corridors);

  ensureConnectivity(rooms, corridors, config, random);

  return { rooms, corridors };
}
