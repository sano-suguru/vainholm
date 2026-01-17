import type { Boss, BossTypeId, Enemy } from './types';

import { useGameStore } from '../stores/gameStore';
import { BOSS_TYPES, ENEMY_TYPES } from './enemyTypes';
import { getManhattanDistance, getDirectionToward } from './pathfinding';
import { getLocalizedBossName } from '../utils/i18n';
import * as m from '../paraglide/messages.js';

let shadeIdCounter = 0;

const MAX_SUMMONED_SHADES = 6;

function createShadeEnemy(position: { x: number; y: number }): Enemy {
  const shadeType = ENEMY_TYPES.shade;
  return {
    id: `shade-summoned-${++shadeIdCounter}`,
    type: 'shade',
    position: { ...position },
    stats: { ...shadeType.baseStats },
    isAlive: true,
    isAware: true,
  };
}

export interface BossAbility {
  name: string;
  cooldown: number;
  /** @returns true if the ability was executed, false if out of range or failed */
  execute: (boss: Boss, store: ReturnType<typeof useGameStore.getState>) => boolean;
}

const createBossAbilities = (typeId: BossTypeId): Map<string, BossAbility> => {
  const abilities = new Map<string, BossAbility>();

  switch (typeId) {
    case 'hrodrvardr':
      abilities.set('divine_smite', {
        name: 'Divine Smite',
        cooldown: 4,
        execute: (boss, store) => {
          const distance = getManhattanDistance(boss.position, store.player.position);
          if (distance > 2) return false;
          const damage = Math.max(1, Math.floor(boss.stats.attack * 1.5) - store.player.stats.defense);
          store.damagePlayer(damage);
            store.addCombatLogEntry({
              tick: store.tick,
              type: 'enemy_attack',
              message: m.combat_boss_divine_smite({ boss: getLocalizedBossName('hrodrvardr'), damage }),
              damage,
            });
          return true;
        },
      });
      break;

    case 'rotgroftr':
      abilities.set('root_grasp', {
        name: 'Root Grasp',
        cooldown: 3,
        execute: (boss, store) => {
          const distance = getManhattanDistance(boss.position, store.player.position);
          if (distance > 3) return false;
          const damage = Math.max(1, boss.stats.attack - store.player.stats.defense);
          store.damagePlayer(damage);
          store.addStatusEffect({
            id: 'slow',
            duration: 2,
            stacks: 1,
            source: 'enemy',
          });
            store.addCombatLogEntry({
              tick: store.tick,
              type: 'enemy_attack',
              message: m.combat_boss_root_grasp({ boss: getLocalizedBossName('rotgroftr'), damage }),
              damage,
            });
          return true;
        },
      });
      break;

    case 'gleymdkonungr':
      abilities.set('spectral_slash', {
        name: 'Spectral Slash',
        cooldown: 3,
        execute: (boss, store) => {
          const distance = getManhattanDistance(boss.position, store.player.position);
          if (distance > 2) return false;
          const damage = Math.max(1, Math.floor(boss.stats.attack * 1.3) - store.player.stats.defense);
          store.damagePlayer(damage);
            store.addCombatLogEntry({
              tick: store.tick,
              type: 'enemy_attack',
              message: m.combat_boss_spectral_slash({ boss: getLocalizedBossName('gleymdkonungr'), damage }),
              damage,
            });
          return true;
        },
      });
      abilities.set('summon_shades', {
        name: 'Summon Shades',
        cooldown: 6,
        execute: (boss, store) => {
          const offsets = [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
          ];
          
          const aliveShades = Array.from(store.enemies.values()).filter((enemy) => {
            return enemy.isAlive && enemy.type === 'shade';
          }).length;

          const remaining = MAX_SUMMONED_SHADES - aliveShades;
          if (remaining <= 0) return false;

          const maxToSummon = Math.min(2, remaining);

          let summoned = 0;
          for (const offset of offsets) {
            if (summoned >= maxToSummon) break;

            const spawnX = boss.position.x + offset.x;
            const spawnY = boss.position.y + offset.y;

            if (
              store.canMoveTo(spawnX, spawnY) &&
              !store.getEnemyAt(spawnX, spawnY) &&
              !(store.player.position.x === spawnX && store.player.position.y === spawnY)
            ) {
              const shade = createShadeEnemy({ x: spawnX, y: spawnY });
              store.addEnemy(shade);
              summoned++;
            }
          }
          if (summoned === 0) return false;
            store.addCombatLogEntry({
              tick: store.tick,
              type: 'enemy_attack',
              message: m.combat_boss_summon_shades({ boss: getLocalizedBossName('gleymdkonungr'), count: summoned }),
            });
          return true;
        },
      });
      break;

    case 'oerslbarn':
      abilities.set('void_pulse', {
        name: 'Void Pulse',
        cooldown: 2,
        execute: (boss, store) => {
          const distance = getManhattanDistance(boss.position, store.player.position);
          if (distance > 4) return false;
          const damage = Math.max(1, boss.stats.attack - store.player.stats.defense);
          store.damagePlayer(damage);
          store.addStatusEffect({
            id: 'blind',
            duration: 2,
            stacks: 1,
            source: 'enemy',
          });
            store.addCombatLogEntry({
              tick: store.tick,
              type: 'enemy_attack',
              message: m.combat_boss_void_pulse({ boss: getLocalizedBossName('oerslbarn'), damage }),
              damage,
            });
          return true;
        },
      });
      abilities.set('reality_tear', {
        name: 'Reality Tear',
        cooldown: 5,
        execute: (boss, store) => {
          const distance = getManhattanDistance(boss.position, store.player.position);
          if (distance > 3) return false;
          const damage = Math.max(1, Math.floor(boss.stats.attack * 2) - store.player.stats.defense);
          store.damagePlayer(damage);
            store.addCombatLogEntry({
              tick: store.tick,
              type: 'enemy_attack',
              message: m.combat_boss_reality_tear({ boss: getLocalizedBossName('oerslbarn'), damage }),
              damage,
            });
          return true;
        },
      });
      break;
  }

  return abilities;
};

const bossAbilitiesCache = new Map<string, Map<string, BossAbility>>();
const bossAbilityCooldownsCache = new Map<string, Map<string, number>>();

const getBossAbilities = (bossId: string, typeId: BossTypeId): Map<string, BossAbility> => {
  if (!bossAbilitiesCache.has(bossId)) {
    bossAbilitiesCache.set(bossId, createBossAbilities(typeId));
  }
  return bossAbilitiesCache.get(bossId)!;
};

const getBossAbilityCooldowns = (bossId: string): Map<string, number> => {
  if (!bossAbilityCooldownsCache.has(bossId)) {
    bossAbilityCooldownsCache.set(bossId, new Map());
  }
  return bossAbilityCooldownsCache.get(bossId)!;
};

export const processBossAI = (boss: Boss): void => {
  const store = useGameStore.getState();
  const { player, canMoveTo, getEnemyAt, damagePlayer, addCombatLogEntry, tick } = store;

  if (!boss.isAlive) return;

  const stunEffect = boss.statusEffects?.get('stun');
  if (stunEffect && stunEffect.duration > 0) return;

  const bossDef = BOSS_TYPES[boss.type];
  const distance = getManhattanDistance(boss.position, player.position);

  if (boss.isAware) {
    if (distance > bossDef.detectionRange) {
      store.updateBoss({ isAware: false });
      return;
    }
  } else {
    if (distance <= bossDef.detectionRange) {
      store.updateBoss({ isAware: true });
    } else {
      return;
    }
  }

  const abilities = getBossAbilities(boss.id, boss.type);
  const cooldowns = getBossAbilityCooldowns(boss.id);
  let usedAbility = false;
  let usedAbilityId: string | null = null;

  for (const [abilityId, ability] of abilities) {
    const currentCooldown = cooldowns.get(abilityId) ?? 0;
    if (currentCooldown <= 0) {
      const executed = ability.execute(boss, store);
      if (executed) {
        cooldowns.set(abilityId, ability.cooldown);
        usedAbility = true;
        usedAbilityId = abilityId;
        break;
      }
    }
  }

  for (const [abilityId] of abilities) {
    if (abilityId === usedAbilityId) continue;
    const currentCooldown = cooldowns.get(abilityId) ?? 0;
    if (currentCooldown > 0) {
      cooldowns.set(abilityId, currentCooldown - 1);
    }
  }

  if (!usedAbility && distance === 1) {
    const damage = Math.max(1, boss.stats.attack - player.stats.defense);
    damagePlayer(damage);
    addCombatLogEntry({
      tick,
      type: 'enemy_attack',
       message: m.combat_boss_attack({ boss: getLocalizedBossName(boss.type), damage }),
      damage,
    });
    return;
  }

  if (distance > 1 && !usedAbility) {
    const isOccupied = (x: number, y: number): boolean => {
      if (player.position.x === x && player.position.y === y) return true;
      return getEnemyAt(x, y) !== null;
    };

    const nextPos = getDirectionToward(
      boss.position,
      player.position,
      canMoveTo,
      isOccupied
    );

    if (nextPos) {
      store.updateBoss({ position: nextPos });
    }
  }
};

export const checkBossPhaseTransition = (boss: Boss): { transitioned: boolean; newPhase: number } => {
  const bossDef = BOSS_TYPES[boss.type];
  const currentPhase = boss.phase;

  if (currentPhase >= bossDef.phases - 1) {
    return { transitioned: false, newPhase: currentPhase };
  }

  const nextPhase = currentPhase + 1;
  const nextPhaseStats = bossDef.phaseStats[nextPhase];

  if (nextPhaseStats && boss.stats.hp <= nextPhaseStats.maxHp) {
    return { transitioned: true, newPhase: nextPhase };
  }

  return { transitioned: false, newPhase: currentPhase };
};

export const clearBossAbilitiesCache = (bossId?: string): void => {
  if (bossId) {
    bossAbilitiesCache.delete(bossId);
    bossAbilityCooldownsCache.delete(bossId);
  } else {
    bossAbilitiesCache.clear();
    bossAbilityCooldownsCache.clear();
  }
};

export const resetShadeIdCounter = (): void => {
  shadeIdCounter = 0;
};
