import { memo, useCallback } from 'react';
import {
  game_over_defeat_title,
  game_over_defeat_message,
  game_over_victory_title,
  game_over_victory_message,
  game_over_victory_true_title,
  game_over_victory_true_message,
  ui_return_to_world,
} from '../../paraglide/messages.js';
import { useGameStore } from '../../stores/gameStore';
import { useDungeonStore } from '../../dungeon';
import { useMetaProgressionStore } from '../../stores/metaProgressionStore';
import styles from '../../styles/game.module.css';

interface GameOverScreenProps {
  type: 'defeat' | 'victory' | 'victory_true';
}

export const GameOverScreen = memo(function GameOverScreen({ type }: GameOverScreenProps) {
  const resetCombatState = useGameStore((state) => state.resetCombatState);
  const restoreWorldMap = useGameStore((state) => state.restoreWorldMap);
  const exitDungeon = useDungeonStore((state) => state.exitDungeon);

  const handleRestart = useCallback(() => {
    useMetaProgressionStore.getState().clearCurrentRunRemnantTrades();
    resetCombatState();
    exitDungeon();
    restoreWorldMap();
  }, [resetCombatState, exitDungeon, restoreWorldMap]);

  const isDefeat = type === 'defeat';
  const isTrueEnding = type === 'victory_true';
  
  const getTitle = () => {
    if (isDefeat) return game_over_defeat_title();
    if (isTrueEnding) return game_over_victory_true_title();
    return game_over_victory_title();
  };
  
  const getMessage = () => {
    if (isDefeat) return game_over_defeat_message();
    if (isTrueEnding) return game_over_victory_true_message();
    return game_over_victory_message();
  };

  return (
    <div className={styles.gameOverContainer}>
      <div className={styles.gameOverContent}>
        <h1 className={isDefeat ? styles.gameOverTitleDefeat : styles.gameOverTitleVictory}>
          {getTitle()}
        </h1>
        <p className={styles.gameOverMessage}>{getMessage()}</p>
        <button className={styles.gameOverButton} onClick={handleRestart}>
          {ui_return_to_world()}
        </button>
      </div>
    </div>
  );
});
