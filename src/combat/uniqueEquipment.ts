import type { Weapon, Armor, BossTypeId } from './types';

export interface UniqueWeapon extends Weapon {
  isUnique: true;
  description: string;
  dropsFrom: BossTypeId;
}

export interface UniqueArmor extends Armor {
  isUnique: true;
  description: string;
  dropsFrom: BossTypeId;
}

export const UNIQUE_WEAPONS: Record<string, UniqueWeapon> = {
  hrodr_blade: {
    id: 'hrodr_blade',
    typeId: 'sword',
    tier: 'legendary',
    name: 'Hróðrvarðr\'s Blade',
    attackBonus: 12,
    premiums: ['undead_slayer', 'life_steal', 'critical_chance'],
    passivePremiums: ['max_hp_percent'],
    isUnique: true,
    description: 'A sacred blade once wielded by the temple guardian.',
    dropsFrom: 'hrodrvardr',
  },
  rot_piercer: {
    id: 'rot_piercer',
    typeId: 'spear',
    tier: 'legendary',
    name: 'Rot Piercer',
    attackBonus: 10,
    premiums: ['poison_on_hit', 'pierce', 'bleed_on_hit'],
    passivePremiums: ['poison_resist'],
    isUnique: true,
    description: 'Forged from the corrupted root, it carries decay itself.',
    dropsFrom: 'rotgroftr',
  },
  void_fang: {
    id: 'void_fang',
    typeId: 'dagger',
    tier: 'legendary',
    name: 'Void Fang',
    attackBonus: 8,
    premiums: ['critical_chance', 'attack_count', 'stun_on_hit'],
    passivePremiums: ['stealth'],
    isUnique: true,
    description: 'A blade from the void, striking from nothingness.',
    dropsFrom: 'oerslbarn',
  },
  kings_mace: {
    id: 'kings_mace',
    typeId: 'mace',
    tier: 'legendary',
    name: 'Forgotten King\'s Mace',
    attackBonus: 14,
    premiums: ['knockback', 'stun_on_hit', 'attack_percent'],
    passivePremiums: ['vision_bonus'],
    isUnique: true,
    description: 'The weapon of a king who chose to be forgotten.',
    dropsFrom: 'gleymdkonungr',
  },
};

export const UNIQUE_ARMORS: Record<string, UniqueArmor> = {
  guardian_plate: {
    id: 'guardian_plate',
    slot: 'body',
    tier: 'legendary',
    name: 'Guardian\'s Plate',
    defenseBonus: 8,
    premiums: ['physical_resist', 'reflect'],
    passivePremiums: ['max_hp_percent'],
    isUnique: true,
    description: 'Armor blessed by fallen temple guardians.',
    dropsFrom: 'hrodrvardr',
  },
  void_shroud: {
    id: 'void_shroud',
    slot: 'body',
    tier: 'legendary',
    name: 'Void Shroud',
    defenseBonus: 5,
    premiums: ['fire_resist', 'ice_resist', 'lightning_resist'],
    passivePremiums: ['stealth'],
    isUnique: true,
    description: 'Woven from the fabric of the void, it bends reality.',
    dropsFrom: 'oerslbarn',
  },
};

export const getUniqueWeaponForBoss = (bossId: BossTypeId): UniqueWeapon | null => {
  return Object.values(UNIQUE_WEAPONS).find(w => w.dropsFrom === bossId) ?? null;
};

export const getUniqueArmorForBoss = (bossId: BossTypeId): UniqueArmor | null => {
  return Object.values(UNIQUE_ARMORS).find(a => a.dropsFrom === bossId) ?? null;
};

export const getAllUniqueEquipmentForBoss = (bossId: BossTypeId): (UniqueWeapon | UniqueArmor)[] => {
  const equipment: (UniqueWeapon | UniqueArmor)[] = [];
  
  const weapon = getUniqueWeaponForBoss(bossId);
  if (weapon) equipment.push(weapon);
  
  const armor = getUniqueArmorForBoss(bossId);
  if (armor) equipment.push(armor);
  
  return equipment;
};
