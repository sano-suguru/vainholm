interface TileEntry {
  readonly id: number;
  readonly type: string;
  readonly walkable: boolean;
  readonly movementCost: number;
  readonly name: string;
  readonly char: string;
}

const TILE_REGISTRY = [
  { id: 0, type: 'grass', walkable: true, movementCost: 1, name: 'Grass', char: '.' },
  { id: 1, type: 'water', walkable: false, movementCost: Infinity, name: 'Water', char: '~' },
  { id: 2, type: 'forest', walkable: true, movementCost: 2, name: 'Forest', char: 'T' },
  { id: 3, type: 'mountain', walkable: false, movementCost: Infinity, name: 'Mountain', char: '^' },
  { id: 4, type: 'sand', walkable: true, movementCost: 1.5, name: 'Sand', char: ':' },
  { id: 5, type: 'road', walkable: true, movementCost: 0.5, name: 'Road', char: '=' },
  { id: 6, type: 'swamp', walkable: true, movementCost: 3, name: 'Swamp', char: '%' },
  { id: 7, type: 'ruins', walkable: true, movementCost: 2, name: 'Ruins', char: '*' },
  { id: 8, type: 'graveyard', walkable: true, movementCost: 1, name: 'Graveyard', char: '+' },
  { id: 9, type: 'blight', walkable: true, movementCost: 1.5, name: 'Blighted Land', char: '!' },
  { id: 10, type: 'lava', walkable: false, movementCost: Infinity, name: 'Lava', char: '~' },
  { id: 11, type: 'chasm', walkable: false, movementCost: Infinity, name: 'Chasm', char: ' ' },
  { id: 12, type: 'dungeon_floor', walkable: true, movementCost: 1, name: 'Dungeon Floor', char: '.' },
  { id: 13, type: 'dungeon_wall', walkable: false, movementCost: Infinity, name: 'Dungeon Wall', char: '#' },
  { id: 14, type: 'stairs_down', walkable: true, movementCost: 1, name: 'Stairs Down', char: '>' },
  { id: 15, type: 'stairs_up', walkable: true, movementCost: 1, name: 'Stairs Up', char: '<' },
  { id: 16, type: 'shallow_water', walkable: true, movementCost: 2, name: 'Shallow Water', char: '~' },
  { id: 17, type: 'hills', walkable: true, movementCost: 1.5, name: 'Hills', char: 'n' },
  { id: 18, type: 'snow', walkable: true, movementCost: 1.5, name: 'Snow', char: '*' },
  { id: 19, type: 'deep_water', walkable: false, movementCost: Infinity, name: 'Deep Water', char: '≈' },
  { id: 20, type: 'ice', walkable: true, movementCost: 0.8, name: 'Ice', char: '=' },
  { id: 21, type: 'frozen_water', walkable: true, movementCost: 1, name: 'Frozen Water', char: '≈' },
  { id: 22, type: 'flowers', walkable: true, movementCost: 1, name: 'Flower Field', char: '"' },
  { id: 23, type: 'bridge', walkable: true, movementCost: 1, name: 'Bridge', char: '=' },
  { id: 24, type: 'wall', walkable: false, movementCost: Infinity, name: 'Wall', char: '#' },
  { id: 25, type: 'floor', walkable: true, movementCost: 1, name: 'Floor', char: '.' },
  { id: 26, type: 'door', walkable: false, movementCost: Infinity, name: 'Door', char: '+' },
  { id: 27, type: 'door_open', walkable: true, movementCost: 1, name: 'Open Door', char: '/' },
  { id: 28, type: 'door_locked', walkable: false, movementCost: Infinity, name: 'Locked Door', char: '+' },
  { id: 29, type: 'door_secret', walkable: false, movementCost: Infinity, name: 'Secret Door', char: '#' },
  { id: 30, type: 'trap_spike', walkable: true, movementCost: 1, name: 'Spike Trap', char: '^' },
  { id: 31, type: 'trap_pit', walkable: true, movementCost: 1, name: 'Pit Trap', char: ' ' },
  { id: 32, type: 'pressure_plate', walkable: true, movementCost: 1, name: 'Pressure Plate', char: '_' },
  { id: 33, type: 'web', walkable: true, movementCost: 3, name: 'Spider Web', char: '%' },
  { id: 34, type: 'rubble', walkable: true, movementCost: 2, name: 'Rubble', char: ';' },
  { id: 35, type: 'bone_pile', walkable: true, movementCost: 1.5, name: 'Bone Pile', char: '%' },
  { id: 36, type: 'blood', walkable: true, movementCost: 1, name: 'Blood', char: ',' },
  { id: 37, type: 'dried_blood', walkable: true, movementCost: 1, name: 'Dried Blood', char: ',' },
  { id: 38, type: 'wall_torch', walkable: false, movementCost: Infinity, name: 'Wall Torch', char: '#' },
  { id: 39, type: 'brazier', walkable: false, movementCost: Infinity, name: 'Brazier', char: '0' },
  { id: 40, type: 'miasma', walkable: true, movementCost: 1.5, name: 'Miasma', char: '░' },
  { id: 41, type: 'corpse_gas', walkable: true, movementCost: 1, name: 'Corpse Gas', char: '░' },
  { id: 42, type: 'cursed_ground', walkable: true, movementCost: 1.5, name: 'Cursed Ground', char: '.' },
  { id: 43, type: 'lichen', walkable: true, movementCost: 1, name: 'Lichen', char: '~' },
  { id: 44, type: 'altar_dark', walkable: false, movementCost: Infinity, name: 'Dark Altar', char: '_' },
  { id: 45, type: 'sarcophagus', walkable: false, movementCost: Infinity, name: 'Sarcophagus', char: '▄' },
  { id: 46, type: 'pillar', walkable: false, movementCost: Infinity, name: 'Pillar', char: 'O' },
  { id: 47, type: 'chain', walkable: true, movementCost: 1, name: 'Chain', char: 'o' },
  { id: 48, type: 'cage', walkable: false, movementCost: Infinity, name: 'Cage', char: '#' },
  { id: 49, type: 'crystal', walkable: false, movementCost: Infinity, name: 'Crystal', char: '*' },
  { id: 50, type: 'dead_forest', walkable: true, movementCost: 2, name: 'Dead Forest', char: 'T' },
  { id: 51, type: 'withered_grass', walkable: true, movementCost: 1, name: 'Withered Grass', char: '.' },
  { id: 52, type: 'toxic_marsh', walkable: true, movementCost: 3, name: 'Toxic Marsh', char: '%' },
  { id: 53, type: 'charred_ground', walkable: true, movementCost: 1, name: 'Charred Ground', char: '.' },
  { id: 54, type: 'salt_flat', walkable: true, movementCost: 1, name: 'Salt Flat', char: ':' },
  { id: 55, type: 'petrified_tree', walkable: false, movementCost: Infinity, name: 'Petrified Tree', char: 'T' },
  { id: 56, type: 'withered_flowers', walkable: true, movementCost: 1, name: 'Withered Flowers', char: '"' },
  { id: 57, type: 'dungeon_entrance', walkable: true, movementCost: 1, name: 'Dungeon Entrance', char: '>' },
  { id: 58, type: 'dungeon_exit', walkable: true, movementCost: 1, name: 'Dungeon Exit', char: '<' },
  { id: 59, type: 'multitile_marker', walkable: false, movementCost: Infinity, name: 'Multi-tile Marker', char: ' ' },
  { id: 60, type: 'collapse_void', walkable: false, movementCost: Infinity, name: 'Collapse Void', char: ' ' },
  { id: 61, type: 'collapse_edge', walkable: false, movementCost: Infinity, name: 'Collapse Edge', char: '░' },
  { id: 62, type: 'cracked_floor', walkable: true, movementCost: 1.2, name: 'Cracked Floor', char: '.' },
  { id: 63, type: 'altar_remnant', walkable: true, movementCost: 1, name: 'Remnant Altar', char: 'Ω' },
  { id: 64, type: 'smoke', walkable: true, movementCost: 1, name: 'Smoke', char: '░' },
  { id: 65, type: 'burning_ground', walkable: true, movementCost: 1.5, name: 'Burning Ground', char: '!' },
  { id: 66, type: 'weapon_shrine', walkable: true, movementCost: 1, name: 'Weapon Shrine', char: '†' },
  // Region-specific floor/wall tiles
  { id: 67, type: 'temple_floor', walkable: true, movementCost: 1, name: 'Temple Floor', char: '.' },
  { id: 68, type: 'temple_wall', walkable: false, movementCost: Infinity, name: 'Temple Wall', char: '#' },
  { id: 69, type: 'root_floor', walkable: true, movementCost: 1, name: 'Root Floor', char: '.' },
  { id: 70, type: 'root_wall', walkable: false, movementCost: Infinity, name: 'Root Wall', char: '#' },
  { id: 71, type: 'fortress_floor', walkable: true, movementCost: 1, name: 'Fortress Floor', char: '.' },
  { id: 72, type: 'fortress_wall', walkable: false, movementCost: Infinity, name: 'Fortress Wall', char: '#' },
  { id: 73, type: 'void_floor', walkable: true, movementCost: 1, name: 'Void Floor', char: '.' },
  { id: 74, type: 'void_wall', walkable: false, movementCost: Infinity, name: 'Void Wall', char: '#' },
] as const satisfies readonly TileEntry[];

export type TileType = (typeof TILE_REGISTRY)[number]['type'];

export const TILE_MAPPING: Record<string, TileType> = Object.fromEntries(
  TILE_REGISTRY.map((t) => [String(t.id), t.type])
) as Record<string, TileType>;

export const TILE_ID_BY_TYPE: Record<TileType, number> = Object.fromEntries(
  TILE_REGISTRY.map((t) => [t.type, t.id])
) as Record<TileType, number>;

interface TileDefinition {
  type: TileType;
  walkable: boolean;
  movementCost: number;
  name: string;
  char: string;
}

export const TILE_DEFINITIONS: Record<TileType, TileDefinition> = Object.fromEntries(
  TILE_REGISTRY.map((t) => [
    t.type,
    {
      type: t.type as TileType,
      walkable: t.walkable,
      movementCost: t.movementCost,
      name: t.name,
      char: t.char,
    },
  ])
) as Record<TileType, TileDefinition>;
