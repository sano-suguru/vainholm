import { memo } from 'react';
import { ui_turn } from '../../../paraglide/messages.js';
import { LanguageSwitcher } from '../LanguageSwitcher';
import styles from '../../../styles/game.module.css';

interface TopBarProps {
  regionName: string;
  floorNumber: number;
  maxFloors: number;
  turn: number;
  isInDungeon: boolean;
}

export const TopBar = memo(function TopBar({
  regionName,
  floorNumber,
  maxFloors,
  turn,
  isInDungeon,
}: TopBarProps) {
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
        <div className={styles.topBarTurn}>{ui_turn({ turn })}</div>
        <LanguageSwitcher />
      </div>
    </div>
  );
});
