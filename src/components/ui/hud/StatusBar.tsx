import { memo, useMemo } from 'react';
import styles from '../../../styles/game.module.css';

interface StatusBarProps {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

type HpState = 'Healthy' | 'Warning' | 'Critical';

function getHpState(hp: number, maxHp: number): HpState {
  if (maxHp <= 0) return 'Critical';
  const ratio = hp / maxHp;
  if (ratio > 0.5) return 'Healthy';
  if (ratio > 0.25) return 'Warning';
  return 'Critical';
}

export const StatusBar = memo(function StatusBar({
  hp,
  maxHp,
  attack,
  defense,
}: StatusBarProps) {
  const hpState = useMemo(() => getHpState(hp, maxHp), [hp, maxHp]);
  const hpPercent = useMemo(
    () => (maxHp <= 0 ? 0 : Math.max(0, (hp / maxHp) * 100)),
    [hp, maxHp]
  );

  const fillClassName = `${styles.hpFill} ${styles[`hpFill${hpState}`]}`;

  return (
    <div className={styles.statusBar}>
      <div className={styles.hpContainer}>
        <div className={styles.hpBar}>
          <div className={fillClassName} style={{ width: `${hpPercent}%` }} />
        </div>
        <span className={styles.hpText}>
          {hp}/{maxHp}
        </span>
      </div>
      <div className={styles.statGroup}>
        <div className={`${styles.stat} ${styles.statAttack}`}>
          <span>⚔</span>
          <span>{attack}</span>
        </div>
        <div className={`${styles.stat} ${styles.statDefense}`}>
          <span>🛡</span>
          <span>{defense}</span>
        </div>
      </div>
    </div>
  );
});
