import { Suspense, lazy, useCallback, useState } from 'react';

import type { BackgroundId, CharacterClassId } from './combat/types';
import type { GameMode } from './dungeon/types';

import { CharacterSelectionScreen } from './components/ui/CharacterSelectionScreen';
import { useGameStore } from './stores/gameStore';
import { useDungeonStore } from './dungeon';

const GameContainer = lazy(async () => {
  const mod = await import('./components/game');
  return { default: mod.GameContainer };
});

type GamePhase = 'character_select' | 'playing';

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('character_select');
  const setCharacter = useGameStore((state) => state.setCharacter);
  const setGameMode = useDungeonStore((state) => state.setGameMode);

  const handleCharacterConfirm = useCallback(
    (classId: CharacterClassId, backgroundId: BackgroundId, gameMode: GameMode) => {
      setCharacter(classId, backgroundId);
      setGameMode(gameMode);
      setGamePhase('playing');
    },
    [setCharacter, setGameMode]
  );

  if (gamePhase === 'character_select') {
    return <CharacterSelectionScreen onConfirm={handleCharacterConfirm} />;
  }

  return (
    <Suspense fallback={null}>
      <GameContainer />
    </Suspense>
  );
}
