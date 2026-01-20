import { memo, useCallback } from 'react';

import { LanguageSwitcher } from '../LanguageSwitcher';
import { m } from '../../../utils/i18nHelpers';
import styles from '../../../styles/game.module.css';

interface TopBarProps {
  regionName: string;
  floorNumber: number;
  maxFloors: number;
  turn: number;
  isInDungeon: boolean;
  turnsUntilCollapse: number | null;
  dungeonSeed: number | null;
}

const getCollapseUrgency = (turns: number): 'safe' | 'warning' | 'danger' | 'critical' => {
  if (turns > 100) return 'safe';
  if (turns > 50) return 'warning';
  if (turns > 20) return 'danger';
  return 'critical';
};

export const TopBar = memo(function TopBar({
  regionName,
  floorNumber,
  maxFloors,
  turn,
  isInDungeon,
  turnsUntilCollapse,
  dungeonSeed,
}: TopBarProps) {
  const collapseUrgency = turnsUntilCollapse !== null ? getCollapseUrgency(turnsUntilCollapse) : null;

  const handleCopySeed = useCallback(() => {
    if (dungeonSeed !== null) {
      navigator.clipboard.writeText(String(dungeonSeed));
    }
  }, [dungeonSeed]);
  
  return (
    <div className={styles.topBar}>
      <div className={styles.topBarLocation}>
        {regionName}
        {isInDungeon && (
          <span className={styles.topBarFloor}>
            {' '}— F{floorNumber}/{maxFloors}
          </span>
        )}
      </div>
      <div className={styles.topBarRight}>
        {isInDungeon && dungeonSeed !== null && (
          <button
            className={styles.topBarSeed}
            onClick={handleCopySeed}
            title="Click to copy"
          >
            Seed: {dungeonSeed}
          </button>
        )}
        {isInDungeon && turnsUntilCollapse !== null && collapseUrgency && (
          <div 
            className={`${styles.topBarCollapse} ${styles[`topBarCollapse${collapseUrgency.charAt(0).toUpperCase()}${collapseUrgency.slice(1)}`]}`}
          >
            {m.ui_collapse_warning({ turns: turnsUntilCollapse })}
          </div>
        )}
        <div className={styles.topBarTurn}>{m.ui_turn({ turn })}</div>
        <LanguageSwitcher />
      </div>
    </div>
  );
});
