import type { TileType, Position } from '../types';

export type InteractionTrigger =
  | 'player_step'
  | 'player_adjacent'
  | 'time_decay'
  | 'fire'
  | 'water'
  | 'ice'
  | 'explosion';

export type EffectType = 'damage' | 'transform' | 'message' | 'slow' | 'chain';

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
      { type: 'transform', transformTo: 'charred_ground' },
      { type: 'chain', chainTrigger: 'fire', chainRadius: 1 },
    ],
  },
  {
    tile: 'forest',
    trigger: 'fire',
    chance: 0.8,
    effects: [
      { type: 'transform', transformTo: 'dead_forest' },
      { type: 'chain', chainTrigger: 'fire', chainRadius: 1 },
    ],
  },
  {
    tile: 'dead_forest',
    trigger: 'fire',
    chance: 0.9,
    effects: [
      { type: 'transform', transformTo: 'charred_ground' },
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
