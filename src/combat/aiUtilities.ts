import type { Ally, Enemy } from './types';
import type { Position } from '../types';
import { useGameStore } from '../stores/gameStore';

export const CARDINAL_DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
] as const;

export const isOccupied = (x: number, y: number): boolean => {
  const { player, getEnemyAt, getAllyAt } = useGameStore.getState();
  if (player.position.x === x && player.position.y === y) return true;
  if (getEnemyAt(x, y) !== null) return true;
  if (getAllyAt(x, y) !== null) return true;
  return false;
};

export const isOccupiedByAllyOrPlayer = (x: number, y: number): boolean => {
  const { player, getAllyAt } = useGameStore.getState();
  if (player.position.x === x && player.position.y === y) return true;
  return getAllyAt(x, y) !== null;
};

export const findAdjacentEnemy = (position: Position): Enemy | null => {
  const { getEnemyAt } = useGameStore.getState();
  for (const dir of CARDINAL_DIRECTIONS) {
    const enemy = getEnemyAt(position.x + dir.x, position.y + dir.y);
    if (enemy && enemy.isAlive) {
      return enemy;
    }
  }
  return null;
};

export const findAdjacentAlly = (position: Position): Ally | null => {
  const { getAllyAt } = useGameStore.getState();
  for (const dir of CARDINAL_DIRECTIONS) {
    const ally = getAllyAt(position.x + dir.x, position.y + dir.y);
    if (ally && ally.isAlive) {
      return ally;
    }
  }
  return null;
};
