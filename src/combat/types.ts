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

// =============================================================================
// Premium System (Two-Layer: Blue = Equipment, Green = Passive)
// =============================================================================

/**
 * 青プレミアム（装備効果）- 装備時のみ発動
 * Blue premiums activate only when equipped
 */
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
  | 'ice_damage'
  | 'lightning_damage'
  | 'undead_slayer'
  | 'attack_count'
  | 'pierce'
  | 'knockback';

/**
 * 緑プレミアム（所持効果）- 持っているだけで発動
 * Green premiums activate just by having the item in inventory
 */
export type PassivePremiumId =
  | 'max_hp_percent'
  | 'vision_bonus'
  | 'trap_sense'
  | 'stealth'
  | 'poison_resist'
  | 'fire_resist';

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
  | { type: 'slayer'; enemyType: string; damageMultiplier: number }
  | { type: 'attack_count'; extraAttacks: number }
  | { type: 'pierce_enemies' }
  | { type: 'knockback_on_hit'; distance: number };

export type PassivePremiumEffect =
  | { type: 'max_hp_percent'; percent: number }
  | { type: 'vision_bonus'; radius: number }
  | { type: 'trap_detection'; radius: number }
  | { type: 'stealth_bonus'; detectionReduction: number }
  | { type: 'resistance'; resistType: 'poison' | 'fire' | 'ice' | 'lightning'; percent: number };

export interface PassivePremium {
  id: PassivePremiumId;
  name: string;
  displayName: string;
  effect: PassivePremiumEffect;
}

export interface Weapon {
  id: string;
  typeId: WeaponTypeId;
  tier: WeaponTier;
  name: string;
  attackBonus: number;
  premiums: WeaponPremiumId[];
  passivePremiums: PassivePremiumId[];
  isUnique?: boolean;
}

// =============================================================================
// Armor System
// =============================================================================

export type ArmorSlot = 'body';

export type ArmorTier = 'common' | 'rare' | 'legendary';

export type ArmorPremiumId =
  | 'physical_resist'
  | 'fire_resist'
  | 'ice_resist'
  | 'lightning_resist'
  | 'reflect'
  | 'thorns';

export type ArmorPremiumEffect =
  | { type: 'damage_reduction'; percent: number }
  | { type: 'elemental_resist'; element: 'fire' | 'ice' | 'lightning'; percent: number }
  | { type: 'reflect_damage'; percent: number }
  | { type: 'thorns_damage'; flatDamage: number };

export interface ArmorPremium {
  id: ArmorPremiumId;
  name: string;
  displayName: string;
  effect: ArmorPremiumEffect;
}

export interface Armor {
  id: string;
  slot: ArmorSlot;
  tier: ArmorTier;
  name: string;
  defenseBonus: number;
  premiums: ArmorPremiumId[];
  passivePremiums: PassivePremiumId[];
  isUnique?: boolean;
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
