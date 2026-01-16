import type { Position } from '../types';

export const getManhattanDistance = (a: Position, b: Position): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

export const getDirectionToward = (
  from: Position,
  to: Position,
  canMoveTo: (x: number, y: number) => boolean,
  isOccupied: (x: number, y: number) => boolean
): Position | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  const candidates: Array<{ pos: Position; priority: number }> = [];
  
  const directions = [
    { x: Math.sign(dx), y: 0 },
    { x: 0, y: Math.sign(dy) },
    { x: -Math.sign(dx), y: 0 },
    { x: 0, y: -Math.sign(dy) },
  ].filter((d) => d.x !== 0 || d.y !== 0);
  
  for (const dir of directions) {
    const newX = from.x + dir.x;
    const newY = from.y + dir.y;
    
    if (canMoveTo(newX, newY) && !isOccupied(newX, newY)) {
      const distance = getManhattanDistance({ x: newX, y: newY }, to);
      candidates.push({ pos: { x: newX, y: newY }, priority: distance });
    }
  }
  
  if (candidates.length === 0) return null;
  
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0].pos;
};
