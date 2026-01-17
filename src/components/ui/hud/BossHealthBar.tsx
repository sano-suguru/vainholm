import { memo, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../stores/gameStore';
import { getLocalizedBossName } from '../../../utils/i18n';
import styles from '../../../styles/game.module.css';

type HpState = 'Healthy' | 'Warning' | 'Critical';

function getHpState(hp: number, maxHp: number): HpState {
  if (maxHp <= 0) return 'Critical';
  const ratio = hp / maxHp;
  if (ratio > 0.5) return 'Healthy';
  if (ratio > 0.25) return 'Warning';
  return 'Critical';
}

export const BossHealthBar = memo(function BossHealthBar() {
  const { currentBoss } = useGameStore(
    useShallow((state) => ({
      currentBoss: state.currentBoss,
    }))
  );

  const bossHp = currentBoss?.stats.hp;
  const bossMaxHp = currentBoss?.stats.maxHp;

  const hpState = useMemo(
    () => (bossHp !== undefined && bossMaxHp !== undefined) 
      ? getHpState(bossHp, bossMaxHp) 
      : 'Healthy',
    [bossHp, bossMaxHp]
  );

  const hpPercent = useMemo(() => {
    if (bossHp === undefined || bossMaxHp === undefined || bossMaxHp <= 0) return 0;
    return Math.max(0, (bossHp / bossMaxHp) * 100);
  }, [bossHp, bossMaxHp]);

  if (!currentBoss?.isAlive) return null;

  const bossName = getLocalizedBossName(currentBoss.type);
  const fillClassName = `${styles.bossHpFill} ${styles[`hpFill${hpState}`]}`;

  return (
    <div className={styles.bossHealthBar}>
      <div className={styles.bossNameRow}>
        <span className={styles.bossName}>{bossName}</span>
        <span className={styles.bossPhase}>
          Phase {currentBoss.phase + 1}/{currentBoss.maxPhases}
        </span>
      </div>
      <div className={styles.bossHpBar}>
        <div className={fillClassName} style={{ width: `${hpPercent}%` }} />
      </div>
    </div>
  );
});
