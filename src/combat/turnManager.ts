import { useGameStore } from '../stores/gameStore';
import { useDungeonStore } from '../dungeon';
import { useDamageNumberStore } from '../stores/damageNumberStore';
import type { TurnPhase, StatusEffectId, StatusEffect, EnemyId, Enemy, Ally, AllyId } from './types';
import { processAllEnemies } from './enemyAI';
import { processAllAllies } from './allyAI';
import { processBossAI } from './bossAI';
import { STATUS_EFFECTS } from './statusEffects';
import { getManhattanDistance } from './pathfinding';
import { getLocalizedAllyName } from '../utils/i18n';
import { combat_ally_lost_to_collapse, combat_ally_died } from '../paraglide/messages.js';

export const executeTurn = (): void => {
  const store = useGameStore.getState();
  
  if (store.gameEndState !== 'playing') {
    return;
  }

  const slowEffect = store.player.statusEffects.get('slow');
  const isPlayerSlowed = slowEffect !== undefined && slowEffect.duration > 0;
  const enemyActionCount = isPlayerSlowed ? 2 : 1;

  // DESIGN: Allies always act once per turn regardless of player slow status.
  // This is intentional: allies are weaker than the player and don't benefit from
  // the player's speed. Slowed allies individually skip turns in processAllyAI.
  store.setTurnPhase('ally');
  processAllAllies();

  for (let i = 0; i < enemyActionCount; i++) {
    store.setTurnPhase('enemy');
    processAllEnemies();
    
    const currentBoss = store.currentBoss;
    if (currentBoss?.isAlive) {
      processBossAI(currentBoss);
    }
  }
  
  store.setTurnPhase('effects');
  processEffects();
  store.setTurnPhase('player');
  store.incrementTick();
  
  checkCollapseGameOver();
};

const COLLAPSE_ALLY_SAFE_DISTANCE = 3;

const checkCollapseGameOver = (): void => {
  const dungeonStore = useDungeonStore.getState();
  if (!dungeonStore.isInDungeon) return;
  
  const gameStore = useGameStore.getState();
  const tick = gameStore.tick;

  if (dungeonStore.checkCollapseGameOver(tick)) {
    gameStore.setGameEndState('defeat');
  }
};

export const checkStrandedAllies = (
  dungeonStore: ReturnType<typeof useDungeonStore.getState>,
  gameStore: ReturnType<typeof useGameStore.getState>,
  direction: 'descend' | 'ascend' = 'descend'
): void => {
  const allies = gameStore.getAllies();
  if (allies.length === 0) return;
  
  const currentFloor = dungeonStore.getCurrentFloor();
  if (!currentFloor) return;
  
  const stairsPosition = direction === 'descend'
    ? currentFloor.stairsDown ?? currentFloor.stairsUp
    : currentFloor.stairsUp ?? currentFloor.stairsDown;
  if (!stairsPosition) return;
  
  for (const ally of allies) {
    const distance = getManhattanDistance(ally.position, stairsPosition);
    if (distance > COLLAPSE_ALLY_SAFE_DISTANCE) {
      gameStore.removeAlly(ally.id);
      const allyDisplayName = getLocalizedAllyName(ally.type);
      gameStore.addCombatLogEntry({
        tick: gameStore.tick,
        message: combat_ally_lost_to_collapse({ ally: allyDisplayName }),
        type: 'ally_death',
      });
    }
  }
};

type StatusEffectTickResult = {
  damageEvents: number[];
  effectsToRemove: StatusEffectId[];
  nextEffects: Map<StatusEffectId, StatusEffect>;
  hasStatusUpdates: boolean;
};

const tickStatusEffects = (
  statusEffects: Map<StatusEffectId, StatusEffect>
): StatusEffectTickResult => {
  const damageEvents: number[] = [];
  const effectsToRemove: StatusEffectId[] = [];
  const nextEffects = new Map<StatusEffectId, StatusEffect>();
  let hasStatusUpdates = false;

  if (statusEffects.size === 0) {
    return { damageEvents, effectsToRemove, nextEffects, hasStatusUpdates };
  }

  for (const [effectId, effect] of statusEffects) {
    const definition = STATUS_EFFECTS[effectId];
    if (!definition) {
      effectsToRemove.push(effectId);
      hasStatusUpdates = true;
      continue;
    }

    if (definition.effect.type === 'damage_over_time') {
      damageEvents.push(definition.effect.damagePerTurn * effect.stacks);
    }

    const newDuration = effect.duration - 1;
    if (newDuration <= 0) {
      effectsToRemove.push(effectId);
      hasStatusUpdates = true;
      continue;
    }

    if (newDuration !== effect.duration) {
      hasStatusUpdates = true;
    }

    nextEffects.set(effectId, { ...effect, duration: newDuration });
  }

  if (nextEffects.size !== statusEffects.size) {
    hasStatusUpdates = true;
  }

  return { damageEvents, effectsToRemove, nextEffects, hasStatusUpdates };
};

const processPlayerStatusEffects = (
  statusEffects: Map<StatusEffectId, StatusEffect>,
  damagePlayer: (amount: number) => void,
  setStatusEffects: (effects: Map<StatusEffectId, StatusEffect>) => void
): StatusEffectId[] => {
  const { damageEvents, effectsToRemove, nextEffects, hasStatusUpdates } = tickStatusEffects(statusEffects);

  for (const damage of damageEvents) {
    damagePlayer(damage);
  }

  if (hasStatusUpdates) {
    setStatusEffects(nextEffects);
  }

  return effectsToRemove;
};

const processEnemyStatusEffects = (
  enemy: Enemy,
  updateEnemy: (id: EnemyId, updates: Partial<Enemy>) => void
): void => {
  if (!enemy.isAlive || !enemy.statusEffects) return;

  const { damageEvents, nextEffects, hasStatusUpdates } = tickStatusEffects(enemy.statusEffects);
  const nextStatusEffects = nextEffects.size > 0 ? nextEffects : undefined;
  const totalDamage = damageEvents.reduce((sum, value) => sum + value, 0);

  if (totalDamage > 0) {
    const newHp = Math.max(0, enemy.stats.hp - totalDamage);
    updateEnemy(enemy.id, {
      stats: { ...enemy.stats, hp: newHp },
      isAlive: newHp > 0,
      statusEffects: nextStatusEffects,
    });
  } else if (hasStatusUpdates) {
    updateEnemy(enemy.id, { statusEffects: nextStatusEffects });
  }
};

const processAllyStatusEffects = (
  ally: Ally,
  updateAlly: (id: AllyId, updates: Partial<Ally>) => void,
  removeAlly: (id: AllyId) => void,
  addCombatLogEntry: ReturnType<typeof useGameStore.getState>['addCombatLogEntry'],
  tick: number
): void => {
  if (!ally.isAlive || !ally.statusEffects) return;

  const { damageEvents, nextEffects, hasStatusUpdates } = tickStatusEffects(ally.statusEffects);
  const nextStatusEffects = nextEffects.size > 0 ? nextEffects : undefined;
  const totalDamage = damageEvents.reduce((sum, value) => sum + value, 0);

  if (totalDamage > 0) {
    useDamageNumberStore.getState().addDamageNumber(ally.position, totalDamage, false, false);
    
    const newHp = Math.max(0, ally.stats.hp - totalDamage);
    const isDead = newHp <= 0;
    
    if (isDead) {
      const allyDisplayName = getLocalizedAllyName(ally.type);
      addCombatLogEntry({
        tick,
        message: combat_ally_died({ ally: allyDisplayName }),
        type: 'ally_death',
      });
      // Set isAlive: false before removal for consistency with enemy death handling
      updateAlly(ally.id, {
        stats: { ...ally.stats, hp: 0 },
        isAlive: false,
      });
      removeAlly(ally.id);
    } else {
      updateAlly(ally.id, {
        stats: { ...ally.stats, hp: newHp },
        statusEffects: nextStatusEffects,
      });
    }
  } else if (hasStatusUpdates) {
    updateAlly(ally.id, { statusEffects: nextStatusEffects });
  }
};

const processEffects = (): void => {
  const store = useGameStore.getState();
  const { player, enemies, damagePlayer, updateEnemy, recalculateVisibility, updateAlly, removeAlly, getAllies, addCombatLogEntry, tick } = store;

  const removedEffects = processPlayerStatusEffects(
    player.statusEffects,
    damagePlayer,
    (effects) => store.updatePlayerStatusEffects(effects)
  );
  
  if (removedEffects.includes('blind')) {
    recalculateVisibility();
  }
  
  for (const enemy of enemies.values()) {
    if (!enemy.isAlive || !enemy.statusEffects) continue;
    processEnemyStatusEffects(enemy, updateEnemy);
  }
  
  for (const ally of getAllies()) {
    if (!ally.isAlive || !ally.statusEffects) continue;
    processAllyStatusEffects(ally, updateAlly, removeAlly, addCombatLogEntry, tick);
  }
};

export const isEnemyStunned = (enemy: Enemy): boolean => {
  if (!enemy.statusEffects) return false;
  const stunEffect = enemy.statusEffects.get('stun');
  return stunEffect !== undefined && stunEffect.duration > 0;
};

export const isPlayerStunned = (): boolean => {
  const { player } = useGameStore.getState();
  const stunEffect = player.statusEffects.get('stun');
  return stunEffect !== undefined && stunEffect.duration > 0;
};

export const getTurnPhase = (): TurnPhase => {
  return useGameStore.getState().turnPhase;
};

export const isPlayerTurn = (): boolean => {
  return useGameStore.getState().turnPhase === 'player';
};
