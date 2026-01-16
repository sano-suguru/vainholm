import type { Position } from '../types';

export type CharacterClassId = 'warrior' | 'hunter' | 'scholar';

export type WeaponTypeId = 'sword' | 'axe' | 'spear' | 'dagger' | 'mace';

export type WeaponTier = 'common' | 'rare' | 'legendary';

export interface Weapon {
  id: string;
  typeId: WeaponTypeId;
  tier: WeaponTier;
  name: string;
  attackBonus: number;
}

export type StatusEffectId = 'poison' | 'bleed' | 'burn' | 'stun' | 'slow' | 'blind';

export interface StatusEffect {
  id: StatusEffectId;
  duration: number;
  stacks: number;
  source: 'tile' | 'enemy' | 'self';
}

export interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export type EnemyId = string;

export type EnemyTypeId = 'skeleton' | 'ghost' | 'cultist';

export interface Enemy {
  id: EnemyId;
  type: EnemyTypeId;
  position: Position;
  stats: CombatStats;
  isAlive: boolean;
  statusEffects?: Map<StatusEffectId, StatusEffect>;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  isLethal: boolean;
}

export type TurnPhase = 'player' | 'enemy' | 'effects';

export type GameEndState = 'playing' | 'victory' | 'defeat';

export interface CombatLogEntry {
  id: string;
  tick: number;
  type: 'player_attack' | 'enemy_attack' | 'player_death' | 'enemy_death';
  message: string;
  damage?: number;
}
