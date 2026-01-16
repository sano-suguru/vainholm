import type { CharacterClass, CharacterClassId } from './types';

export const CLASSES: Record<CharacterClassId, CharacterClass> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    displayName: '戦士',
    description: '被弾時に反撃する。被弾覚悟で殴り合うスタイル。',
    statModifiers: {
      hp: 5,
      attack: 1,
      defense: 1,
    },
    passiveAbility: {
      type: 'counter_attack',
      chance: 0.3,
      damageMultiplier: 0.5,
    },
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    displayName: '狩人',
    description: '罠を感知できる。罠を見て避ける/誘導するスタイル。',
    statModifiers: {
      hp: 0,
      attack: 2,
      defense: 0,
    },
    passiveAbility: {
      type: 'trap_sense',
      detectionRadius: 3,
    },
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    displayName: '学者',
    description: 'アイテムが最初から鑑定済み。知識で生き残る。',
    statModifiers: {
      hp: -5,
      attack: 0,
      defense: 0,
    },
    passiveAbility: {
      type: 'item_identification',
      identified: true,
    },
  },
};

export const getClass = (id: CharacterClassId): CharacterClass => CLASSES[id];

export const CLASS_IDS: CharacterClassId[] = ['warrior', 'hunter', 'scholar'];
