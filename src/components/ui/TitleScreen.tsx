import { memo, useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useMetaProgressionStore } from '../../stores/metaProgressionStore';
import styles from '../../styles/game.module.css';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenEncyclopedia: () => void;
}

export const TitleScreen = memo(function TitleScreen({ onStartGame, onOpenEncyclopedia }: TitleScreenProps) {
  const [fadeIn, setFadeIn] = useState(false);
  const { totalRuns, totalVictories, deepestFloorReached } = useMetaProgressionStore(
    useShallow((state) => ({
      totalRuns: state.totalRuns,
      totalVictories: state.totalVictories,
      deepestFloorReached: state.deepestFloorReached,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const hasProgress = totalRuns > 0;

  return (
    <div className={styles.titleScreenContainer}>
      <div className={`${styles.titleScreenContent} ${fadeIn ? styles.titleScreenFadeIn : ''}`}>
        <div className={styles.titleScreenHeader}>
          <div className={styles.titleScreenRune}>&#x16A8;</div>
          <h1 className={styles.titleScreenTitle}>VAINHOLM</h1>
          <div className={styles.titleScreenRune}>&#x16A8;</div>
        </div>
        
        <p className={styles.titleScreenSubtitle}>虚栄の島</p>
        
        <div className={styles.titleScreenDivider}>
          <span className={styles.titleScreenDividerLine} />
          <span className={styles.titleScreenDividerRune}>&#x16C7;</span>
          <span className={styles.titleScreenDividerLine} />
        </div>

        <p className={styles.titleScreenTagline}>
          底には、神々が恐れたものがある
        </p>

        <div className={styles.titleScreenButtons}>
          <button
            type="button"
            className={styles.titleScreenButton}
            onClick={onStartGame}
          >
            旅を始める
          </button>
          {hasProgress && (
            <button
              type="button"
              className={styles.titleScreenButtonSecondary}
              onClick={onOpenEncyclopedia}
            >
              図鑑
            </button>
          )}
        </div>

        {hasProgress && (
          <div className={styles.titleScreenStats}>
            <div className={styles.titleScreenStatItem}>
              <span className={styles.titleScreenStatLabel}>探索回数</span>
              <span className={styles.titleScreenStatValue}>{totalRuns}</span>
            </div>
            <div className={styles.titleScreenStatDivider}>|</div>
            <div className={styles.titleScreenStatItem}>
              <span className={styles.titleScreenStatLabel}>到達最深部</span>
              <span className={styles.titleScreenStatValue}>F{deepestFloorReached}</span>
            </div>
            <div className={styles.titleScreenStatDivider}>|</div>
            <div className={styles.titleScreenStatItem}>
              <span className={styles.titleScreenStatLabel}>帰還</span>
              <span className={styles.titleScreenStatValue}>{totalVictories}</span>
            </div>
          </div>
        )}

        <div className={styles.titleScreenFooter}>
          <p className={styles.titleScreenHint}>WASD / 矢印キーで移動</p>
        </div>
      </div>
    </div>
  );
});
