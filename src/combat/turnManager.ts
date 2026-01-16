import { useGameStore } from '../stores/gameStore';
import type { TurnPhase } from './types';
import { processAllEnemies } from './enemyAI';

export const executeTurn = (): void => {
  const store = useGameStore.getState();
  
  if (store.gameEndState !== 'playing') {
    return;
  }

  store.setTurnPhase('enemy');
  processAllEnemies();
  store.setTurnPhase('effects');
  processEffects();
  store.setTurnPhase('player');
  store.incrementTick();
};

const processEffects = (): void => {
};

export const getTurnPhase = (): TurnPhase => {
  return useGameStore.getState().turnPhase;
};

export const isPlayerTurn = (): boolean => {
  return useGameStore.getState().turnPhase === 'player';
};
