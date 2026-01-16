import { memo, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useDungeonStore } from '../../dungeon';
import styles from '../../styles/game.module.css';

interface GameOverScreenProps {
  type: 'defeat' | 'victory';
}

export const GameOverScreen = memo(function GameOverScreen({ type }: GameOverScreenProps) {
  const resetCombatState = useGameStore((state) => state.resetCombatState);
  const restoreWorldMap = useGameStore((state) => state.restoreWorldMap);
  const exitDungeon = useDungeonStore((state) => state.exitDungeon);

  const handleRestart = useCallback(() => {
    resetCombatState();
    exitDungeon();
    restoreWorldMap();
  }, [resetCombatState, exitDungeon, restoreWorldMap]);

  const isDefeat = type === 'defeat';
  const title = isDefeat ? 'You Died' : 'Victory';
  const message = isDefeat
    ? 'The darkness has claimed another soul...'
    : 'You have conquered the depths of Hróðrgraf!';

  return (
    <div className={styles.gameOverContainer}>
      <div className={styles.gameOverContent}>
        <h1 className={isDefeat ? styles.gameOverTitleDefeat : styles.gameOverTitleVictory}>
          {title}
        </h1>
        <p className={styles.gameOverMessage}>{message}</p>
        <button className={styles.gameOverButton} onClick={handleRestart}>
          Return to World
        </button>
      </div>
    </div>
  );
});
