import { memo, useEffect, useRef } from 'react';
import {
  game_over_defeat_title,
  game_over_defeat_message,
  game_over_victory_title,
  game_over_victory_message,
  game_over_victory_true_title,
  game_over_victory_true_message,
} from '../../paraglide/messages.js';
import { useMetaProgressionStore } from '../../stores/metaProgressionStore';
import { useDungeonStore } from '../../dungeon';
import styles from '../../styles/game.module.css';

interface GameOverScreenProps {
  type: 'defeat' | 'victory' | 'victory_true';
  onNewGame: () => void;
}

export const GameOverScreen = memo(function GameOverScreen({ type, onNewGame }: GameOverScreenProps) {
  const gameMode = useDungeonStore((state) => state.gameMode);
  const advancedModeUnlocked = useMetaProgressionStore((state) => state.advancedModeUnlocked);
  const unlockAdvancedMode = useMetaProgressionStore((state) => state.unlockAdvancedMode);
  const recordRunEnd = useMetaProgressionStore((state) => state.recordRunEnd);

  const hasRecordedRef = useRef(false);

  const isDefeat = type === 'defeat';
  const isVictory = type === 'victory' || type === 'victory_true';
  const isTrueEnding = type === 'victory_true';

  const shouldUnlockAdvancedMode = isVictory && gameMode === 'normal' && !advancedModeUnlocked;

  useEffect(() => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    recordRunEnd(isVictory);

    if (shouldUnlockAdvancedMode) {
      unlockAdvancedMode();
    }

    useMetaProgressionStore.getState().clearCurrentRunRemnantTrades();
  }, [isVictory, recordRunEnd, shouldUnlockAdvancedMode, unlockAdvancedMode]);

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
        
        <div className={styles.gameOverButtons}>
          <button className={styles.gameOverButton} onClick={onNewGame}>
            新しい旅を始める
          </button>
        </div>

        {shouldUnlockAdvancedMode && (
          <p className={styles.gameOverUnlock}>上級モードが解放されました</p>
        )}
      </div>
    </div>
  );
});
