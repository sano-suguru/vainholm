import type { TileType, Position } from '../types';

export type InteractionTrigger =
  | 'player_step'
  | 'player_adjacent'
  | 'time_decay'
  | 'fire'
  | 'water'
  | 'ice'
  | 'lightning'
  | 'explosion';

export type ElementType = 'fire' | 'ice' | 'lightning';

export const elementToTrigger = (element: ElementType): InteractionTrigger => {
  return element;
};

export type EffectType = 'damage' | 'transform' | 'message' | 'slow' | 'chain' | 'descend' | 'ascend' | 'enter_dungeon' | 'exit_dungeon' | 'open_remnant_trade' | 'recruit_ally' | 'drop_weapon';

export interface TriggerEffect {
  type: EffectType;
  damageAmount?: number;
  damageType?: 'fire' | 'poison' | 'physical' | 'magic';
  transformTo?: TileType;
  message?: string;
  chainTrigger?: InteractionTrigger;
  chainRadius?: number;
}

interface TriggerInteraction {
  tile: TileType;
  trigger: InteractionTrigger;
  chance: number;
  effects: TriggerEffect[];
}

const TRIGGER_INTERACTIONS: TriggerInteraction[] = [
  {
    tile: 'stairs_down',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'descend' },
      { type: 'message', message: 'You descend deeper into the dungeon.' },
    ],
  },
  {
    tile: 'stairs_up',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'ascend' },
      { type: 'message', message: 'You ascend to the upper floor.' },
    ],
  },
  {
    tile: 'dungeon_entrance',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'enter_dungeon' },
      { type: 'message', message: 'You descend into the ancient depths...' },
    ],
  },
  {
    tile: 'dungeon_exit',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'exit_dungeon' },
      { type: 'message', message: 'You emerge into daylight.' },
    ],
  },
  {
    tile: 'altar_remnant',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'open_remnant_trade' },
    ],
  },
  {
    tile: 'trap_spike',
    trigger: 'player_step',
    chance: 0.8,
    effects: [
      { type: 'damage', damageAmount: 10, damageType: 'physical' },
      { type: 'message', message: 'You step on a spike trap!' },
    ],
  },
  {
    tile: 'trap_pit',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 15, damageType: 'physical' },
      { type: 'message', message: 'You fall into a pit!' },
    ],
  },
  {
    tile: 'pressure_plate',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'message', message: 'Click. Something shifts in the distance.' },
    ],
  },
  {
    tile: 'web',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'slow' },
      { type: 'message', message: 'You struggle through the sticky web.' },
    ],
  },
  {
    tile: 'miasma',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 3, damageType: 'poison' },
      { type: 'message', message: 'The poisonous miasma burns your lungs.' },
    ],
  },
  {
    tile: 'corpse_gas',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 2, damageType: 'poison' },
      { type: 'message', message: 'The stench of decay overwhelms you.' },
    ],
  },
  {
    tile: 'cursed_ground',
    trigger: 'player_step',
    chance: 0.5,
    effects: [
      { type: 'damage', damageAmount: 5, damageType: 'magic' },
      { type: 'message', message: 'Dark energy seeps into your soul.' },
    ],
  },
  {
    tile: 'toxic_marsh',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 4, damageType: 'poison' },
      { type: 'message', message: 'The toxic water burns your skin.' },
    ],
  },
  {
    tile: 'swamp',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'slow' },
      { type: 'message', message: 'The swamp slows your movement.' },
    ],
  },
  {
    tile: 'burning_ground',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 8, damageType: 'fire' },
      { type: 'message', message: 'The flames burn you!' },
    ],
  },
  {
    tile: 'smoke',
    trigger: 'player_step',
    chance: 0.5,
    effects: [
      { type: 'damage', damageAmount: 1, damageType: 'poison' },
      { type: 'message', message: 'You choke on the smoke.' },
    ],
  },
  {
    tile: 'lava',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 50, damageType: 'fire' },
      { type: 'message', message: 'You are engulfed in molten rock!' },
    ],
  },
  {
    tile: 'web',
    trigger: 'fire',
    chance: 1.0,
    effects: [
      { type: 'transform', transformTo: 'charred_ground' },
      { type: 'chain', chainTrigger: 'fire', chainRadius: 1 },
    ],
  },
  {
    tile: 'corpse_gas',
    trigger: 'fire',
    chance: 1.0,
    effects: [
      { type: 'transform', transformTo: 'charred_ground' },
      { type: 'chain', chainTrigger: 'explosion', chainRadius: 2 },
      { type: 'damage', damageAmount: 20, damageType: 'fire' },
    ],
  },
  {
    tile: 'grass',
    trigger: 'fire',
    chance: 0.7,
    effects: [
      { type: 'transform', transformTo: 'burning_ground' },
      { type: 'chain', chainTrigger: 'fire', chainRadius: 1 },
    ],
  },
  {
    tile: 'burning_ground',
    trigger: 'time_decay',
    chance: 0.3,
    effects: [{ type: 'transform', transformTo: 'smoke' }],
  },
  {
    tile: 'smoke',
    trigger: 'time_decay',
    chance: 0.2,
    effects: [{ type: 'transform', transformTo: 'charred_ground' }],
  },
  {
    tile: 'burning_ground',
    trigger: 'water',
    chance: 1.0,
    effects: [{ type: 'transform', transformTo: 'charred_ground' }],
  },
  {
    tile: 'forest',
    trigger: 'fire',
    chance: 0.8,
    effects: [
      { type: 'transform', transformTo: 'burning_ground' },
      { type: 'chain', chainTrigger: 'fire', chainRadius: 1 },
    ],
  },
  {
    tile: 'dead_forest',
    trigger: 'fire',
    chance: 0.9,
    effects: [
      { type: 'transform', transformTo: 'burning_ground' },
      { type: 'chain', chainTrigger: 'fire', chainRadius: 1 },
    ],
  },
  {
    tile: 'water',
    trigger: 'ice',
    chance: 1.0,
    effects: [{ type: 'transform', transformTo: 'frozen_water' }],
  },
  {
    tile: 'shallow_water',
    trigger: 'ice',
    chance: 1.0,
    effects: [{ type: 'transform', transformTo: 'ice' }],
  },
  {
    tile: 'frozen_water',
    trigger: 'fire',
    chance: 1.0,
    effects: [{ type: 'transform', transformTo: 'shallow_water' }],
  },
  {
    tile: 'ice',
    trigger: 'fire',
    chance: 1.0,
    effects: [{ type: 'transform', transformTo: 'shallow_water' }],
  },
  {
    tile: 'snow',
    trigger: 'fire',
    chance: 1.0,
    effects: [{ type: 'transform', transformTo: 'grass' }],
  },
  {
    tile: 'door',
    trigger: 'explosion',
    chance: 0.8,
    effects: [{ type: 'transform', transformTo: 'rubble' }],
  },
  {
    tile: 'door_locked',
    trigger: 'explosion',
    chance: 0.6,
    effects: [{ type: 'transform', transformTo: 'rubble' }],
  },
  {
    tile: 'web',
    trigger: 'explosion',
    chance: 1.0,
    effects: [{ type: 'transform', transformTo: 'rubble' }],
  },
  {
    tile: 'pillar',
    trigger: 'explosion',
    chance: 0.3,
    effects: [{ type: 'transform', transformTo: 'rubble' }],
  },
  {
    tile: 'blood',
    trigger: 'time_decay',
    chance: 0.1,
    effects: [{ type: 'transform', transformTo: 'dried_blood' }],
  },
  {
    tile: 'cage',
    trigger: 'player_adjacent',
    chance: 1.0,
    effects: [
      { type: 'recruit_ally' },
      { type: 'transform', transformTo: 'dungeon_floor' },
      { type: 'message', message: 'You freed a survivor trapped in the cage!' },
    ],
  },
  {
    tile: 'corpse_gas',
    trigger: 'time_decay',
    chance: 0.05,
    effects: [{ type: 'transform', transformTo: 'floor' }],
  },
  {
    tile: 'miasma',
    trigger: 'time_decay',
    chance: 0.03,
    effects: [{ type: 'transform', transformTo: 'swamp' }],
  },
  {
    tile: 'water',
    trigger: 'lightning',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 15, damageType: 'magic' },
      { type: 'chain', chainTrigger: 'lightning', chainRadius: 2 },
    ],
  },
  {
    tile: 'shallow_water',
    trigger: 'lightning',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 10, damageType: 'magic' },
      { type: 'chain', chainTrigger: 'lightning', chainRadius: 1 },
    ],
  },
  {
    tile: 'swamp',
    trigger: 'lightning',
    chance: 1.0,
    effects: [
      { type: 'damage', damageAmount: 12, damageType: 'magic' },
      { type: 'chain', chainTrigger: 'lightning', chainRadius: 1 },
    ],
  },
  {
    tile: 'weapon_shrine',
    trigger: 'player_step',
    chance: 1.0,
    effects: [
      { type: 'drop_weapon' },
      { type: 'transform', transformTo: 'dungeon_floor' },
      { type: 'message', message: 'You discover a weapon at the shrine.' },
    ],
  },
];

const triggerInteractionMap = new Map<string, TriggerInteraction>();

function buildTriggerInteractionMap(): void {
  if (triggerInteractionMap.size > 0) return;
  for (const interaction of TRIGGER_INTERACTIONS) {
    const key = `${interaction.tile}:${interaction.trigger}`;
    triggerInteractionMap.set(key, interaction);
  }
}

function getTriggerInteraction(
  tile: TileType,
  trigger: InteractionTrigger
): TriggerInteraction | null {
  buildTriggerInteractionMap();
  return triggerInteractionMap.get(`${tile}:${trigger}`) ?? null;
}

export interface TriggerResult {
  position: Position;
  effects: TriggerEffect[];
  chainReactions: Array<{ position: Position; trigger: InteractionTrigger }>;
}

export function processTrigger(
  position: Position,
  tile: TileType,
  trigger: InteractionTrigger,
  random: () => number = Math.random
): TriggerResult | null {
  const interaction = getTriggerInteraction(tile, trigger);
  if (!interaction) return null;

  if (random() > interaction.chance) return null;

  const chainReactions: TriggerResult['chainReactions'] = [];

  for (const effect of interaction.effects) {
    if (effect.type === 'chain' && effect.chainTrigger && effect.chainRadius) {
      for (let dy = -effect.chainRadius; dy <= effect.chainRadius; dy++) {
        for (let dx = -effect.chainRadius; dx <= effect.chainRadius; dx++) {
          if (dx === 0 && dy === 0) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= effect.chainRadius) {
            chainReactions.push({
              position: { x: position.x + dx, y: position.y + dy },
              trigger: effect.chainTrigger,
            });
          }
        }
      }
    }
  }

  return { position, effects: interaction.effects, chainReactions };
}

export interface ChainReactionProcessor {
  getTileAt: (x: number, y: number) => TileType | null;
  setTileAt: (x: number, y: number, tileType: TileType) => void;
  applyDamage?: (position: Position, amount: number, damageType: string) => void;
}

export function processChainReactions(
  initialResult: TriggerResult,
  processor: ChainReactionProcessor,
  maxIterations = 50,
  random: () => number = Math.random
): void {
  const queue: Array<{ position: Position; trigger: InteractionTrigger }> = [
    ...initialResult.chainReactions,
  ];
  const processed = new Set<string>();
  processed.add(`${initialResult.position.x},${initialResult.position.y}`);

  let iterations = 0;
  while (queue.length > 0 && iterations < maxIterations) {
    const current = queue.shift();
    if (!current) break;

    const key = `${current.position.x},${current.position.y}`;
    if (processed.has(key)) continue;
    processed.add(key);

    const tileType = processor.getTileAt(current.position.x, current.position.y);
    if (!tileType) continue;

    const result = processTrigger(current.position, tileType, current.trigger, random);
    if (!result) continue;

    for (const effect of result.effects) {
      if (effect.type === 'transform' && effect.transformTo) {
        processor.setTileAt(current.position.x, current.position.y, effect.transformTo);
      }
      if (effect.type === 'damage' && processor.applyDamage && effect.damageAmount && effect.damageType) {
        processor.applyDamage(current.position, effect.damageAmount, effect.damageType);
      }
    }

    for (const chainReaction of result.chainReactions) {
      const chainKey = `${chainReaction.position.x},${chainReaction.position.y}`;
      if (!processed.has(chainKey)) {
        queue.push(chainReaction);
      }
    }

    iterations++;
  }
}
