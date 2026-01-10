import type { MapData, TileId } from '../types';

const TILE_MAPPING = {
  '0': 'grass',
  '1': 'water',
  '2': 'forest',
  '3': 'mountain',
  '4': 'sand',
  '5': 'road',
  '6': 'swamp',
  '7': 'ruins',
  '8': 'graveyard',
  '9': 'blight',
  '10': 'lava',
  '11': 'chasm',
  '12': 'dungeon_floor',
  '13': 'dungeon_wall',
  '14': 'stairs_down',
  '15': 'stairs_up',
} as const;

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function generateTile(
  x: number,
  y: number,
  width: number,
  height: number,
  random: () => number
): TileId {
  const centerX = width / 2;
  const centerY = height / 2;
  const distFromCenter = Math.sqrt(
    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
  );
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  const normalizedDist = distFromCenter / maxDist;

  if (normalizedDist > 0.85) {
    return random() < 0.7 ? 1 : 3;
  }

  if (normalizedDist > 0.7) {
    const r = random();
    if (r < 0.3) return 3;
    if (r < 0.5) return 2;
    return 0;
  }

  const noise = random();
  if (noise < 0.6) return 0;
  if (noise < 0.75) return 2;
  if (noise < 0.85) return 4;
  return 0;
}

function addRiver(
  data: TileId[][],
  width: number,
  height: number,
  random: () => number
): void {
  let x = Math.floor(width * 0.3 + random() * width * 0.4);
  let y = 0;

  while (y < height) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      if (nx >= 0 && nx < width) {
        data[y][nx] = 1;
      }
    }

    y++;
    const drift = random();
    if (drift < 0.3) x = Math.max(5, x - 1);
    else if (drift > 0.7) x = Math.min(width - 6, x + 1);
  }
}

function addLakes(
  data: TileId[][],
  width: number,
  height: number,
  random: () => number
): void {
  const lakeCount = 3 + Math.floor(random() * 3);

  for (let i = 0; i < lakeCount; i++) {
    const cx = 10 + Math.floor(random() * (width - 20));
    const cy = 10 + Math.floor(random() * (height - 20));
    const radius = 3 + Math.floor(random() * 4);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + random() * 0.5) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
            data[ny][nx] = 1;
          }
        }
      }
    }
  }
}

function addRoads(data: TileId[][], width: number, height: number): void {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  for (let x = centerX - 15; x <= centerX + 15; x++) {
    if (x >= 0 && x < width && data[centerY][x] !== 1) {
      data[centerY][x] = 5;
    }
  }

  for (let y = centerY - 15; y <= centerY + 15; y++) {
    if (y >= 0 && y < height && data[y][centerX] !== 1) {
      data[y][centerX] = 5;
    }
  }
}

function addSwamps(
  data: TileId[][],
  width: number,
  height: number,
  random: () => number
): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (data[y][x] === 1) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (data[ny][nx] === 0 && random() < 0.3) {
                data[ny][nx] = 6;
              }
            }
          }
        }
      }
    }
  }
}

function addRuins(
  data: TileId[][],
  width: number,
  height: number,
  random: () => number
): void {
  const ruinCount = 3 + Math.floor(random() * 4);

  for (let i = 0; i < ruinCount; i++) {
    const cx = 10 + Math.floor(random() * (width - 20));
    const cy = 10 + Math.floor(random() * (height - 20));
    const size = 2 + Math.floor(random() * 2);

    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -size; dx <= size; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          if (data[ny][nx] === 0 && random() < 0.6) {
            data[ny][nx] = 7;
          }
        }
      }
    }
  }
}

function addGraveyards(
  data: TileId[][],
  width: number,
  height: number,
  random: () => number
): void {
  const graveyardCount = 2 + Math.floor(random() * 2);

  for (let i = 0; i < graveyardCount; i++) {
    const cx = 15 + Math.floor(random() * (width - 30));
    const cy = 15 + Math.floor(random() * (height - 30));
    const sizeX = 3 + Math.floor(random() * 3);
    const sizeY = 2 + Math.floor(random() * 2);

    for (let dy = -sizeY; dy <= sizeY; dy++) {
      for (let dx = -sizeX; dx <= sizeX; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          if (data[ny][nx] === 0) {
            data[ny][nx] = 8;
          }
        }
      }
    }
  }
}

function addBlightedAreas(
  data: TileId[][],
  width: number,
  height: number,
  random: () => number
): void {
  const blightCount = 2 + Math.floor(random() * 3);

  for (let i = 0; i < blightCount; i++) {
    const cx = 10 + Math.floor(random() * (width - 20));
    const cy = 10 + Math.floor(random() * (height - 20));
    const radius = 4 + Math.floor(random() * 4);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
            if ((data[ny][nx] === 0 || data[ny][nx] === 2) && random() < 0.7) {
              data[ny][nx] = 9;
            }
          }
        }
      }
    }
  }
}

function addFeatures(
  data: TileId[][],
  width: number,
  height: number,
  random: () => number
): void {
  addRiver(data, width, height, random);
  addLakes(data, width, height, random);
  addRoads(data, width, height);
  addSwamps(data, width, height, random);
  addRuins(data, width, height, random);
  addGraveyards(data, width, height, random);
  addBlightedAreas(data, width, height, random);
}

export function generateMapData(
  width: number,
  height: number,
  seed: number = 12345
): MapData {
  const random = seededRandom(seed);
  const data: TileId[][] = [];

  for (let y = 0; y < height; y++) {
    const row: TileId[] = [];
    for (let x = 0; x < width; x++) {
      row.push(generateTile(x, y, width, height, random));
    }
    data.push(row);
  }

  addFeatures(data, width, height, random);

  return {
    name: 'Generated World',
    width,
    height,
    tileSize: 32,
    layers: [{ name: 'terrain', data }],
    tileMapping: TILE_MAPPING,
    spawnPoint: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
  };
}
