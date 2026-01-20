import type { MapData, Position, TileId } from '../types';

export function floodFill(map: MapData, start: Position): Set<string> {
  const visited = new Set<string>();
  const queue: Position[] = [start];
  const terrainLayer = map.layers.find((l) => l.name === 'terrain');

  if (!terrainLayer) return visited;

  const featureLayer = map.layers.find((l) => l.name === 'features');

  const isWalkable = (x: number, y: number): boolean => {
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false;

    if (featureLayer) {
      const featureId = featureLayer.data[y]?.[x];
      if (featureId !== undefined && featureId !== 0) {
        const featureType = map.tileMapping[String(featureId)];
        if (
          featureType === 'stairs_down' ||
          featureType === 'stairs_up' ||
          featureType === 'dungeon_exit' ||
          featureType === 'dungeon_entrance'
        ) {
          return true;
        }
      }
    }

    const tileId = terrainLayer.data[y]?.[x];
    if (tileId === undefined) return false;
    const tileType = map.tileMapping[String(tileId)];
    if (!tileType) return false;
    return (
      tileType === 'dungeon_floor' ||
      tileType === 'temple_floor' ||
      tileType === 'root_floor' ||
      tileType === 'fortress_floor' ||
      tileType === 'void_floor' ||
      tileType === 'cracked_floor' ||
      tileType === 'collapse_edge'
    );
  };

  while (queue.length > 0) {
    const pos = queue.shift()!;
    const key = `${pos.x},${pos.y}`;

    if (visited.has(key)) continue;
    if (!isWalkable(pos.x, pos.y)) continue;

    visited.add(key);

    queue.push({ x: pos.x + 1, y: pos.y });
    queue.push({ x: pos.x - 1, y: pos.y });
    queue.push({ x: pos.x, y: pos.y + 1 });
    queue.push({ x: pos.x, y: pos.y - 1 });
  }

  return visited;
}

export function mapToAscii(map: MapData, highlights?: Map<string, string>): string {
  const terrainLayer = map.layers.find((l) => l.name === 'terrain');
  const featureLayer = map.layers.find((l) => l.name === 'features');

  if (!terrainLayer) return '';

  const lines: string[] = [];

  for (let y = 0; y < map.height; y++) {
    let line = '';
    for (let x = 0; x < map.width; x++) {
      const key = `${x},${y}`;

      if (highlights?.has(key)) {
        line += highlights.get(key);
        continue;
      }

      let tileId: TileId | undefined;

      if (featureLayer) {
        const featureId = featureLayer.data[y]?.[x];
        if (featureId !== undefined && featureId !== 0) {
          tileId = featureId;
        }
      }

      if (tileId === undefined) {
        tileId = terrainLayer.data[y]?.[x];
      }

      if (tileId === undefined) {
        line += '?';
        continue;
      }

      const tileType = map.tileMapping[String(tileId)];

      switch (tileType) {
        case 'dungeon_floor':
        case 'temple_floor':
        case 'root_floor':
        case 'fortress_floor':
        case 'void_floor':
          line += '.';
          break;
        case 'dungeon_wall':
        case 'temple_wall':
        case 'root_wall':
        case 'fortress_wall':
        case 'void_wall':
          line += '#';
          break;
        case 'stairs_down':
          line += '>';
          break;
        case 'stairs_up':
          line += '<';
          break;
        case 'dungeon_exit':
          line += 'E';
          break;
        case 'dungeon_entrance':
          line += 'I';
          break;
        case 'pillar':
          line += 'O';
          break;
        case 'rubble':
          line += ';';
          break;
        case 'bone_pile':
          line += '%';
          break;
        case 'collapse_void':
          line += ' ';
          break;
        case 'collapse_edge':
          line += '~';
          break;
        case 'cracked_floor':
          line += ',';
          break;
        default:
          line += '?';
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}

export function isReachable(map: MapData, from: Position, to: Position): boolean {
  const reachable = floodFill(map, from);
  return reachable.has(`${to.x},${to.y}`);
}

export function countReachableTiles(map: MapData, from: Position): number {
  return floodFill(map, from).size;
}

export function countTotalWalkableTiles(map: MapData): number {
  const terrainLayer = map.layers.find((l) => l.name === 'terrain');
  if (!terrainLayer) return 0;

  let count = 0;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileId = terrainLayer.data[y]?.[x];
      if (tileId === undefined) continue;
      const tileType = map.tileMapping[String(tileId)];
      if (
        tileType === 'dungeon_floor' ||
        tileType === 'temple_floor' ||
        tileType === 'root_floor' ||
        tileType === 'fortress_floor' ||
        tileType === 'void_floor' ||
        tileType === 'cracked_floor' ||
        tileType === 'collapse_edge'
      ) count++;
    }
  }
  return count;
}
