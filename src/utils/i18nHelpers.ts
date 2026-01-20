import * as m from '../paraglide/messages.js';

import type { 
  WeaponPremiumId, 
  PassivePremiumId, 
  ArmorPremiumId, 
  WeaponTypeId, 
  WeaponTier, 
  ArmorTier,
  StatusEffectId,
  AllyTypeId,
} from '../combat/types';

export { m };

export const getWeaponTypeDisplayName = (id: WeaponTypeId): string => {
  const messages: Record<WeaponTypeId, () => string> = {
    sword: m.weapon_type_sword,
    axe: m.weapon_type_axe,
    spear: m.weapon_type_spear,
    dagger: m.weapon_type_dagger,
    mace: m.weapon_type_mace,
  };
  return messages[id]();
};

export const getWeaponPremiumDisplayName = (id: WeaponPremiumId): string => {
  const messages: Record<WeaponPremiumId, () => string> = {
    hp_bonus: m.weapon_premium_hp_bonus,
    attack_percent: m.weapon_premium_attack_percent,
    critical_chance: m.weapon_premium_critical_chance,
    life_steal: m.weapon_premium_life_steal,
    poison_on_hit: m.weapon_premium_poison_on_hit,
    bleed_on_hit: m.weapon_premium_bleed_on_hit,
    burn_on_hit: m.weapon_premium_burn_on_hit,
    stun_on_hit: m.weapon_premium_stun_on_hit,
    fire_damage: m.weapon_premium_fire_damage,
    undead_slayer: m.weapon_premium_undead_slayer,
    ice_damage: m.weapon_premium_ice_damage,
    lightning_damage: m.weapon_premium_lightning_damage,
    attack_count: m.weapon_premium_attack_count,
    pierce: m.weapon_premium_pierce,
    knockback: m.weapon_premium_knockback,
  };
  return messages[id]();
};

export const getPassivePremiumDisplayName = (id: PassivePremiumId): string => {
  const messages: Record<PassivePremiumId, () => string> = {
    max_hp_percent: m.passive_premium_max_hp_percent,
    vision_bonus: m.passive_premium_vision_bonus,
    trap_sense: m.passive_premium_trap_sense,
    stealth: m.passive_premium_stealth,
    poison_resist: m.passive_premium_poison_resist,
    fire_resist: m.passive_premium_fire_resist,
  };
  return messages[id]();
};

export const getArmorPremiumDisplayName = (id: ArmorPremiumId): string => {
  const messages: Record<ArmorPremiumId, () => string> = {
    physical_resist: m.armor_premium_physical_resist,
    fire_resist: m.armor_premium_fire_resist,
    ice_resist: m.armor_premium_ice_resist,
    lightning_resist: m.armor_premium_lightning_resist,
    reflect: m.armor_premium_reflect,
    thorns: m.armor_premium_thorns,
  };
  return messages[id]();
};

export const getTierDisplayName = (tier: WeaponTier | ArmorTier): string => {
  const messages: Record<string, () => string> = {
    common: m.tier_common,
    rare: m.tier_rare,
    legendary: m.tier_legendary,
  };
  return messages[tier]();
};

export const getArmorTierName = (tier: ArmorTier): string => {
  const messages: Record<ArmorTier, () => string> = {
    common: m.armor_tier_common,
    rare: m.armor_tier_rare,
    legendary: m.armor_tier_legendary,
  };
  return messages[tier]();
};

export const getStatusEffectDisplayName = (id: StatusEffectId): string => {
  const messages: Record<StatusEffectId, () => string> = {
    poison: m.status_poison,
    bleed: m.status_bleed,
    burn: m.status_burn,
    stun: m.status_stun,
    slow: m.status_slow,
    blind: m.status_blind,
    invulnerable: m.status_invulnerable,
  };
  return messages[id]();
};

export const getAllyTypeDisplayName = (id: AllyTypeId): string => {
  const messages: Record<AllyTypeId, () => string> = {
    skeleton: m.ally_skeleton,
    ghost: m.ally_ghost,
    cultist: m.ally_cultist,
    wraith: m.ally_wraith,
    shade: m.ally_shade,
    hollow_knight: m.ally_hollow_knight,
    survivor: m.ally_survivor,
  };
  return messages[id]();
};
