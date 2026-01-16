import { memo, useCallback } from 'react';

import type { UpgradeCategory, UpgradeDefinition } from '../../progression/types';

import styles from '../../styles/game.module.css';

interface LevelUpScreenProps {
  choices: UpgradeDefinition[];
  onSelect: (upgradeId: string) => void;
  floor: number;
}

const CATEGORY_SYMBOLS: Record<UpgradeCategory, string> = {
  stat: '◆',
  passive: '◈',
  active: '⬡',
  weapon: '⚔',
  terrain: '⌘',
  remnant: '✧',
};

export const LevelUpScreen = memo(function LevelUpScreen({
  choices,
  onSelect,
  floor,
}: LevelUpScreenProps) {
  const handleCardClick = useCallback(
    (upgradeId: string) => {
      onSelect(upgradeId);
    },
    [onSelect]
  );

  return (
    <div className={styles.levelUpOverlay}>
      <div className={styles.levelUpModal}>
        <div className={styles.levelUpHeader}>
          <div className={styles.levelUpHeaderLine} />
          <h2 className={styles.levelUpTitle}>深度 {floor} に到達</h2>
          <div className={styles.levelUpHeaderLine} />
        </div>
        <p className={styles.levelUpSubtitle}>力を選べ、旅人よ</p>
        <div className={styles.levelUpCardGrid}>
          {choices.map((upgrade) => (
            <button
              key={upgrade.id}
              className={`${styles.levelUpCard} ${styles[`levelUpCard_${upgrade.category}`]}`}
              onClick={() => handleCardClick(upgrade.id)}
              type="button"
            >
              <div className={styles.levelUpCardInner}>
                <span
                  className={`${styles.levelUpCardCategory} ${styles[`levelUpCategory_${upgrade.category}`]}`}
                >
                  {CATEGORY_SYMBOLS[upgrade.category]}
                </span>
                <h3 className={styles.levelUpCardName}>{upgrade.nameKey}</h3>
                <div className={styles.levelUpCardDivider} />
                <p className={styles.levelUpCardDesc}>{upgrade.descriptionKey}</p>
                <span className={styles.levelUpCardCategoryLabel}>{upgrade.category}</span>
              </div>
              <div className={styles.levelUpCardGlow} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
