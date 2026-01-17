import type { Position } from '../types';

// =============================================================================
// Character Classes
// =============================================================================

export type CharacterClassId = 'warrior' | 'hunter' | 'scholar';

export interface CharacterClass {
  id: CharacterClassId;
  name: string;
  displayName: string;
  description: string;
  /** Base stat modifiers */
  statModifiers: {
    hp: number;
    attack: number;
    defense: number;
  };
  /** Unique passive ability */
  passiveAbility: ClassPassiveAbility;
}

export type ClassPassiveAbility =
  | { type: 'counter_attack'; chance: number; damageMultiplier: number }
  | { type: 'trap_sense'; detectionRadius: number }
  | { type: 'item_identification'; identified: boolean };

// =============================================================================
// Backgrounds / Origins
// =============================================================================

export type BackgroundId =
  | 'fallen_noble'
  | 'orphan'
  | 'ex_soldier'
  | 'herbalist_apprentice'
  | 'thief_child'
  | 'temple_raised';

export interface Background {
  id: BackgroundId;
  name: string;
  displayName: string;
  description: string;
  effect: BackgroundEffect;
}

export type BackgroundEffect =
  | { type: 'extra_starting_item'; count: number }
  | { type: 'trap_damage_reduction'; multiplier: number }
  | { type: 'bonus_hp'; amount: number }
  | { type: 'healing_bonus'; multiplier: number }
  | { type: 'stealth_damage_bonus'; amount: number }
  | { type: 'remnant_cost_reduction'; multiplier: number };

// =============================================================================
// Weapons
// =============================================================================

export type WeaponTypeId = 'sword' | 'axe' | 'spear' | 'dagger' | 'mace';

export type WeaponTier = 'common' | 'rare' | 'legendary';

export interface WeaponPattern {
  id: WeaponTypeId;
  name: string;
  displayName: string;
  attackType: WeaponAttackType;
}

export type WeaponAttackType =
  | { type: 'standard' }
  | { type: 'cleave'; directions: 8 }
  | { type: 'pierce'; range: number }
  | { type: 'stealth_bonus'; multiplier: number }
  | { type: 'knockback'; distance: number };

export type WeaponPremiumId =
  | 'hp_bonus'
  | 'attack_percent'
  | 'critical_chance'
  | 'life_steal'
  | 'poison_on_hit'
  | 'bleed_on_hit'
  | 'burn_on_hit'
  | 'stun_on_hit'
  | 'fire_damage'
  | 'undead_slayer';

export interface WeaponPremium {
  id: WeaponPremiumId;
  name: string;
  displayName: string;
  effect: WeaponPremiumEffect;
}

export type WeaponPremiumEffect =
  | { type: 'stat_bonus'; stat: 'hp' | 'attack' | 'defense'; value: number; isPercent: boolean }
  | { type: 'critical_bonus'; chance: number }
  | { type: 'life_steal'; percent: number }
  | { type: 'status_on_hit'; status: StatusEffectId; duration: number; chance: number }
  | { type: 'elemental_damage'; element: 'fire' | 'ice' | 'lightning'; damage: number }
  | { type: 'slayer'; enemyType: string; damageMultiplier: number };

export interface Weapon {
  id: string;
  typeId: WeaponTypeId;
  tier: WeaponTier;
  name: string;
  attackBonus: number;
  premiums: WeaponPremiumId[];
}

// =============================================================================
// Status Effects
// =============================================================================

export type StatusEffectId = 'poison' | 'bleed' | 'burn' | 'stun' | 'slow' | 'blind' | 'invulnerable';

export interface StatusEffectDefinition {
  id: StatusEffectId;
  name: string;
  displayName: string;
  description: string;
  stackable: boolean;
  maxStacks: number;
  effect: StatusEffectType;
}

export type StatusEffectType =
  | { type: 'damage_over_time'; damagePerTurn: number }
  | { type: 'skip_turn' }
  | { type: 'slow'; movementPenalty: number }
  | { type: 'vision_reduction'; radiusReduction: number }
  | { type: 'invulnerability' };

export interface StatusEffect {
  id: StatusEffectId;
  duration: number;
  stacks: number;
  source: 'tile' | 'enemy' | 'self' | 'player';
}

export interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export type EnemyId = string;

export type EnemyTypeId = 
  | 'skeleton' 
  | 'ghost' 
  | 'cultist'
  | 'wraith'
  | 'crawler'
  | 'shade'
  | 'hollow_knight'
  | 'blight_spawn'
  | 'void_worm';

export type BossTypeId = 
  | 'hrodrvardr'
  | 'rotgroftr'
  | 'gleymdkonungr'
  | 'oerslbarn';

export interface Enemy {
  id: EnemyId;
  type: EnemyTypeId;
  position: Position;
  stats: CombatStats;
  isAlive: boolean;
  isAware: boolean;
  statusEffects?: Map<StatusEffectId, StatusEffect>;
}

export interface Boss {
  id: string;
  type: BossTypeId;
  position: Position;
  stats: CombatStats;
  isAlive: boolean;
  isAware: boolean;
  statusEffects?: Map<StatusEffectId, StatusEffect>;
  phase: number;
  maxPhases: number;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  isLethal: boolean;
}

export type TurnPhase = 'player' | 'enemy' | 'effects';

export type GameEndState = 'playing' | 'victory' | 'victory_true' | 'defeat';

export interface CombatLogEntry {
  id: string;
  tick: number;
  type: 'player_attack' | 'enemy_attack' | 'player_death' | 'enemy_death';
  message: string;
  damage?: number;
}
