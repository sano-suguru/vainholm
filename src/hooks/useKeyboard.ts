import { useEffect, useCallback, useRef } from 'react';
import { KEY_BINDINGS } from '../utils/constants';

interface UseKeyboardOptions {
  onMove: (dx: number, dy: number) => void;
  onDebugToggle?: () => void;
  moveDelay?: number;
}

export function useKeyboard({
  onMove,
  onDebugToggle,
  moveDelay = 150,
}: UseKeyboardOptions) {
  const pressedKeys = useRef<Set<string>>(new Set());
  const lastMoveTime = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;

    pressedKeys.current.add(e.code);

    if (KEY_BINDINGS.debug.includes(e.code as typeof KEY_BINDINGS.debug[number])) {
      onDebugToggle?.();
      return;
    }

    const now = Date.now();
    if (now - lastMoveTime.current < moveDelay) return;

    let dx = 0;
    let dy = 0;

    if (KEY_BINDINGS.up.some((k) => pressedKeys.current.has(k))) dy = -1;
    else if (KEY_BINDINGS.down.some((k) => pressedKeys.current.has(k))) dy = 1;
    else if (KEY_BINDINGS.left.some((k) => pressedKeys.current.has(k))) dx = -1;
    else if (KEY_BINDINGS.right.some((k) => pressedKeys.current.has(k))) dx = 1;

    if (dx !== 0 || dy !== 0) {
      lastMoveTime.current = now;
      onMove(dx, dy);
    }
  }, [onMove, onDebugToggle, moveDelay]);

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
      const now = Date.now();
      if (now - lastMoveTime.current < moveDelay) return;

      let dx = 0;
      let dy = 0;

      if (KEY_BINDINGS.up.some((k) => pressedKeys.current.has(k))) dy = -1;
      else if (KEY_BINDINGS.down.some((k) => pressedKeys.current.has(k))) dy = 1;
      else if (KEY_BINDINGS.left.some((k) => pressedKeys.current.has(k))) dx = -1;
      else if (KEY_BINDINGS.right.some((k) => pressedKeys.current.has(k))) dx = 1;

      if (dx !== 0 || dy !== 0) {
        lastMoveTime.current = now;
        onMove(dx, dy);
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [onMove, moveDelay]);
}
