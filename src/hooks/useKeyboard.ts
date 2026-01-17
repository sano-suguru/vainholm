import { useEffect, useCallback, useRef } from 'react';
import { KEY_BINDINGS } from '../utils/constants';

interface UseKeyboardOptions {
  onMove: (dx: number, dy: number) => void;
  onDebugToggle?: () => void;
  onQuickbarUse?: (slotIndex: number) => void;
  moveDelay?: number;
}

interface Direction {
  dx: number;
  dy: number;
}

function getDirectionFromKeys(pressedKeys: Set<string>): Direction {
  if (KEY_BINDINGS.up.some((k) => pressedKeys.has(k))) return { dx: 0, dy: -1 };
  if (KEY_BINDINGS.down.some((k) => pressedKeys.has(k))) return { dx: 0, dy: 1 };
  if (KEY_BINDINGS.left.some((k) => pressedKeys.has(k))) return { dx: -1, dy: 0 };
  if (KEY_BINDINGS.right.some((k) => pressedKeys.has(k))) return { dx: 1, dy: 0 };
  return { dx: 0, dy: 0 };
}

export function useKeyboard({
  onMove,
  onDebugToggle,
  onQuickbarUse,
  moveDelay = 150,
}: UseKeyboardOptions) {
  const pressedKeys = useRef<Set<string>>(new Set());
  const lastMoveTime = useRef<number>(0);

  const tryMove = useCallback((now: number) => {
    if (now - lastMoveTime.current < moveDelay) return;

    const { dx, dy } = getDirectionFromKeys(pressedKeys.current);
    if (dx !== 0 || dy !== 0) {
      lastMoveTime.current = now;
      onMove(dx, dy);
    }
  }, [onMove, moveDelay]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;

    pressedKeys.current.add(e.code);

    if (KEY_BINDINGS.debug.includes(e.code as typeof KEY_BINDINGS.debug[number])) {
      onDebugToggle?.();
      return;
    }

    const quickbarIndex = KEY_BINDINGS.quickbar.indexOf(e.code as typeof KEY_BINDINGS.quickbar[number]);
    if (quickbarIndex !== -1) {
      onQuickbarUse?.(quickbarIndex);
      return;
    }

    tryMove(Date.now());
  }, [onDebugToggle, onQuickbarUse, tryMove]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    pressedKeys.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      tryMove(Date.now());
    }, 50);

    return () => clearInterval(intervalId);
  }, [tryMove]);
}
