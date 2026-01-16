export type UpgradeCategory =
  | 'stat'
  | 'passive'
  | 'active'
  | 'weapon'
  | 'terrain'
  | 'remnant';

export type UpgradeId = string;

export interface StatModifier {
  stat: 'hp' | 'maxHp' | 'attack' | 'defense' | 'visionRange';
  value: number;
  isPercentage?: boolean;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  category: UpgradeCategory;
  nameKey: string;
  descriptionKey: string;
  icon?: string;
  statModifiers?: StatModifier[];
  passiveEffect?: PassiveEffectId;
  activeAbility?: ActiveAbilityId;
  minFloor?: number;
  maxFloor?: number;
  requiredUpgrades?: UpgradeId[];
  excludedUpgrades?: UpgradeId[];
  weight?: number;
}

export type PassiveEffectId =
  | 'night_vision'
  | 'trap_sense'
  | 'iron_stomach'
  | 'quick_feet'
  | 'thick_skin'
  | 'lucky'
  | 'regeneration'
  | 'scavenger';

export type ActiveAbilityId =
  | 'emergency_dodge'
  | 'heal_surge'
  | 'berserk'
  | 'shadow_step';

export interface ActiveAbilityState {
  id: ActiveAbilityId;
  usesRemaining: number;
  cooldown: number;
}

export interface ProgressionState {
  currentLevel: number;
  acquiredUpgrades: UpgradeId[];
  activeAbilities: ActiveAbilityState[];
  passiveEffects: PassiveEffectId[];
  pendingLevelUp: boolean;
  currentChoices: UpgradeDefinition[] | null;
}

export interface LevelUpEvent {
  floor: number;
  choices: UpgradeDefinition[];
}
