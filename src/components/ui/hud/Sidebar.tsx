import { memo, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Sword, Shield, Heart } from 'lucide-react';
import { useGameStore } from '../../../stores/gameStore';
import styles from '../../../styles/game.module.css';

interface SidebarProps {
  onEquipmentClick?: () => void;
}

function getHpStateClass(hp: number, maxHp: number): string {
  if (maxHp <= 0) return styles.sidebarHpCritical;
  const ratio = hp / maxHp;
  if (ratio > 0.5) return styles.sidebarHpHealthy;
  if (ratio > 0.25) return styles.sidebarHpWarning;
  return styles.sidebarHpCritical;
}

export const Sidebar = memo(function Sidebar({ onEquipmentClick }: SidebarProps) {
  const { player, enemies } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      enemies: state.enemies,
    }))
  );

  const isTileVisible = useGameStore((state) => state.isTileVisible);

  const visibleEnemies = useMemo(() => {
    const px = player.position.x;
    const py = player.position.y;

    return Array.from(enemies.values())
      .filter((e) => e.isAlive && isTileVisible(e.position.x, e.position.y))
      .map((e) => ({
        ...e,
        distance: Math.abs(e.position.x - px) + Math.abs(e.position.y - py),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4);
  }, [enemies, player.position.x, player.position.y, isTileVisible]);

  const hpPercent =
    player.stats.maxHp > 0
      ? Math.max(0, (player.stats.hp / player.stats.maxHp) * 100)
      : 0;
  const hpStateClass = getHpStateClass(player.stats.hp, player.stats.maxHp);

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarSection}>
        <div className={styles.sidebarSectionHeader}>
          <span className={styles.sidebarSectionIcon}>♦</span>
          <span>PLAYER</span>
        </div>

        <div className={styles.sidebarPlayerHp}>
          <div className={styles.sidebarHpLabel}>
            <Heart size={12} />
            <span>HP</span>
          </div>
          <div className={styles.sidebarHpBarContainer}>
            <div
              className={`${styles.sidebarHpBar} ${hpStateClass}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <span className={styles.sidebarHpValue}>
            {player.stats.hp}/{player.stats.maxHp}
          </span>
        </div>

        <div className={styles.sidebarStats}>
          <div className={styles.sidebarStatItem}>
            <Sword size={14} className={styles.sidebarStatIconAttack} />
            <span className={styles.sidebarStatValue}>{player.stats.attack}</span>
          </div>
          <div className={styles.sidebarStatItem}>
            <Shield size={14} className={styles.sidebarStatIconDefense} />
            <span className={styles.sidebarStatValue}>{player.stats.defense}</span>
          </div>
        </div>
      </div>

      {(player.weapon || player.armor) && (
        <div 
          className={`${styles.sidebarSection} ${onEquipmentClick ? styles.sidebarSectionClickable : ''}`}
          onClick={onEquipmentClick}
          role={onEquipmentClick ? 'button' : undefined}
          tabIndex={onEquipmentClick ? 0 : undefined}
          onKeyDown={onEquipmentClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onEquipmentClick(); } : undefined}
        >
          <div className={styles.sidebarSectionHeader}>
            <span className={styles.sidebarSectionIcon}>⚔</span>
            <span>EQUIPMENT</span>
            {onEquipmentClick && <span className={styles.sidebarKeyHint}>[E]</span>}
          </div>
          {player.weapon && (
            <div className={styles.sidebarEquipmentItem}>
              <span className={styles.sidebarEquipmentName}>{player.weapon.name}</span>
              <span className={styles.sidebarEquipmentStat}>+{player.weapon.attackBonus}</span>
            </div>
          )}
          {player.armor && (
            <div className={styles.sidebarEquipmentItem}>
              <span className={styles.sidebarEquipmentName}>{player.armor.name}</span>
              <span className={styles.sidebarEquipmentStat}>+{player.armor.defenseBonus}</span>
            </div>
          )}
        </div>
      )}

      {visibleEnemies.length > 0 && (
        <div className={styles.sidebarSection}>
          <div className={styles.sidebarSectionHeader}>
            <span className={styles.sidebarSectionIcon}>⚠</span>
            <span>NEARBY</span>
          </div>
          {visibleEnemies.map((enemy) => {
            const enemyHpPercent =
              enemy.stats.maxHp > 0
                ? (enemy.stats.hp / enemy.stats.maxHp) * 100
                : 0;
            return (
              <div key={enemy.id} className={styles.sidebarEnemyItem}>
                <div className={styles.sidebarEnemyInfo}>
                  <span className={styles.sidebarEnemySymbol}>
                    {enemy.type.charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.sidebarEnemyName}>{enemy.type}</span>
                </div>
                <div className={styles.sidebarEnemyHpContainer}>
                  <div
                    className={styles.sidebarEnemyHpBar}
                    style={{ width: `${enemyHpPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
