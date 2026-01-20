import { memo, useEffect, useMemo, useRef } from 'react';

import { useMetaProgressionStore } from '../../stores/metaProgressionStore';
import { useGameStore } from '../../stores/gameStore';
import { useDungeonStore } from '../../dungeon';
import { m } from '../../utils/i18nHelpers';
import styles from '../../styles/game.module.css';

interface GameOverScreenProps {
  type: 'defeat' | 'victory' | 'victory_true';
  onNewGame: () => void;
}

export const GameOverScreen = memo(function GameOverScreen({ type, onNewGame }: GameOverScreenProps) {
  const gameMode = useDungeonStore((state) => state.gameMode);
  const currentFloor = useDungeonStore((state) => state.dungeon?.currentFloor ?? 1);
  const runStats = useGameStore((state) => state.runStats);
  const advancedModeUnlocked = useMetaProgressionStore((state) => state.advancedModeUnlocked);
  const unlockAdvancedMode = useMetaProgressionStore((state) => state.unlockAdvancedMode);
  const recordRunEnd = useMetaProgressionStore((state) => state.recordRunEnd);
  const calculateLegacyPoints = useMetaProgressionStore((state) => state.calculateLegacyPoints);

  const hasRecordedRef = useRef(false);

  const isDefeat = type === 'defeat';
  const isVictory = type === 'victory' || type === 'victory_true';
  const isTrueEnding = type === 'victory_true';

  const shouldUnlockAdvancedMode = isVictory && gameMode === 'normal' && !advancedModeUnlocked;

  const legacyPoints = useMemo(
    () => calculateLegacyPoints(currentFloor, runStats.enemiesDefeated, runStats.bossesDefeated),
    [calculateLegacyPoints, currentFloor, runStats.enemiesDefeated, runStats.bossesDefeated]
  );

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
    if (isDefeat) return m.game_over_defeat_title();
    if (isTrueEnding) return m.game_over_victory_true_title();
    return m.game_over_victory_title();
  };
  
  const getMessage = () => {
    if (isDefeat) return m.game_over_defeat_message();
    if (isTrueEnding) return m.game_over_victory_true_message();
    return m.game_over_victory_message();
  };

  return (
    <div className={styles.gameOverContainer}>
      <div className={styles.gameOverContent}>
        <h1 className={isDefeat ? styles.gameOverTitleDefeat : styles.gameOverTitleVictory}>
          {getTitle()}
        </h1>
        <p className={styles.gameOverMessage}>{getMessage()}</p>
        
        <div className={styles.legacyPointsSection}>
          <h2 className={styles.legacyPointsTitle}>遺産ポイント</h2>
          <div className={styles.legacyPointsBreakdown}>
            <div className={styles.legacyPointsRow}>
              <span>到達フロア ({currentFloor}F)</span>
              <span>+{legacyPoints.floorBonus}</span>
            </div>
            <div className={styles.legacyPointsRow}>
              <span>敵撃破 ({runStats.enemiesDefeated}体)</span>
              <span>+{legacyPoints.enemyBonus}</span>
            </div>
            <div className={styles.legacyPointsRow}>
              <span>ボス撃破 ({runStats.bossesDefeated}体)</span>
              <span>+{legacyPoints.bossBonus}</span>
            </div>
            <div className={styles.legacyPointsTotal}>
              <span>合計</span>
              <span>{legacyPoints.total}</span>
            </div>
          </div>
        </div>
        
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
