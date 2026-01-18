import { Suspense, lazy, useCallback, useState } from 'react';

import type { BackgroundId, CharacterClassId } from './combat/types';
import type { GameMode } from './dungeon/types';

import { TitleScreen } from './components/ui/TitleScreen';
import { CharacterSelectionScreen } from './components/ui/CharacterSelectionScreen';
import { EncyclopediaScreen } from './components/ui/EncyclopediaScreen';
import { useGameStore } from './stores/gameStore';
import { useDungeonStore } from './dungeon';
import { useProgressionStore } from './progression';

const GameContainer = lazy(async () => {
  const mod = await import('./components/game');
  return { default: mod.GameContainer };
});

type GamePhase = 'title' | 'character_select' | 'encyclopedia' | 'playing';

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('title');
  const setCharacter = useGameStore((state) => state.setCharacter);
  const resetGame = useGameStore((state) => state.resetGame);
  const setGameMode = useDungeonStore((state) => state.setGameMode);
  const resetProgression = useProgressionStore((state) => state.resetProgression);

  const handleStartGame = useCallback(() => {
    setGamePhase('character_select');
  }, []);

  const handleOpenEncyclopedia = useCallback(() => {
    setGamePhase('encyclopedia');
  }, []);

  const handleBackToTitle = useCallback(() => {
    setGamePhase('title');
  }, []);

  const handleCharacterConfirm = useCallback(
    (classId: CharacterClassId, backgroundId: BackgroundId, gameMode: GameMode) => {
      setCharacter(classId, backgroundId);
      setGameMode(gameMode);
      setGamePhase('playing');
    },
    [setCharacter, setGameMode]
  );

  const handleReturnToTitle = useCallback(() => {
    resetGame();
    resetProgression();
    setGamePhase('title');
  }, [resetGame, resetProgression]);

  if (gamePhase === 'title') {
    return (
      <TitleScreen
        onStartGame={handleStartGame}
        onOpenEncyclopedia={handleOpenEncyclopedia}
      />
    );
  }

  if (gamePhase === 'encyclopedia') {
    return <EncyclopediaScreen onBack={handleBackToTitle} />;
  }

  if (gamePhase === 'character_select') {
    return <CharacterSelectionScreen onConfirm={handleCharacterConfirm} />;
  }

  return (
    <Suspense fallback={null}>
      <GameContainer onReturnToTitle={handleReturnToTitle} />
    </Suspense>
  );
}
