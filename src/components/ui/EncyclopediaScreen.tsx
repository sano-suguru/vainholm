import { memo, useCallback, useState, useMemo } from 'react';

import type { EnemyTypeId, BossTypeId } from '../../combat/types';
import type { RemnantId } from '../../progression/remnants';

import { ENEMY_TYPES, BOSS_TYPES } from '../../combat/enemyTypes';
import { REMNANTS } from '../../progression/remnants';
import { useMetaProgressionStore } from '../../stores/metaProgressionStore';
import styles from '../../styles/game.module.css';

type TabId = 'enemies' | 'bosses' | 'remnants';

interface EncyclopediaScreenProps {
  onBack: () => void;
}

const REGION_NAMES = {
  hrodrgraf: '栄光の墓',
  rotmyrkr: '根の闇',
  gleymdariki: '忘却の王国',
  upphafsdjup: '起源の深淵',
} as const;

type KnownRegionId = keyof typeof REGION_NAMES;

function getRegionName(region: string): string {
  return REGION_NAMES[region as KnownRegionId] ?? region;
}

export const EncyclopediaScreen = memo(function EncyclopediaScreen({
  onBack,
}: EncyclopediaScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>('enemies');
  
  const { enemyEncounters, bossEncounters, remnantTrades } = useMetaProgressionStore((state) => ({
    enemyEncounters: state.enemyEncounters,
    bossEncounters: state.bossEncounters,
    remnantTrades: state.remnantTrades,
  }));

  const encounteredEnemyIds = useMemo(() => {
    return new Set(Object.keys(enemyEncounters) as EnemyTypeId[]);
  }, [enemyEncounters]);

  const encounteredBossIds = useMemo(() => {
    return new Set(Object.keys(bossEncounters) as BossTypeId[]);
  }, [bossEncounters]);

  const tradedRemnantIds = useMemo(() => {
    return new Set(remnantTrades.map((t) => t.remnantId));
  }, [remnantTrades]);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const enemyList = useMemo(() => Object.values(ENEMY_TYPES), []);
  const bossList = useMemo(() => Object.values(BOSS_TYPES), []);
  const remnantList = useMemo(() => Object.values(REMNANTS), []);

  const enemyCount = `${encounteredEnemyIds.size}/${enemyList.length}`;
  const bossCount = `${encounteredBossIds.size}/${bossList.length}`;
  const remnantCount = `${tradedRemnantIds.size}/${remnantList.length}`;

  return (
    <div className={styles.encyclopediaContainer}>
      <div className={styles.encyclopediaContent}>
        <div className={styles.encyclopediaHeader}>
          <button
            type="button"
            className={styles.encyclopediaBackButton}
            onClick={onBack}
          >
            戻る
          </button>
          <h1 className={styles.encyclopediaTitle}>図鑑</h1>
          <div className={`${styles.encyclopediaBackButton} ${styles.encyclopediaBackButtonPlaceholder}`}>
            戻る
          </div>
        </div>

        <div className={styles.encyclopediaTabs}>
          <button
            type="button"
            className={`${styles.encyclopediaTab} ${activeTab === 'enemies' ? styles.encyclopediaTabActive : ''}`}
            onClick={() => handleTabChange('enemies')}
          >
            敵 ({enemyCount})
          </button>
          <button
            type="button"
            className={`${styles.encyclopediaTab} ${activeTab === 'bosses' ? styles.encyclopediaTabActive : ''}`}
            onClick={() => handleTabChange('bosses')}
          >
            ボス ({bossCount})
          </button>
          <button
            type="button"
            className={`${styles.encyclopediaTab} ${activeTab === 'remnants' ? styles.encyclopediaTabActive : ''}`}
            onClick={() => handleTabChange('remnants')}
          >
            残滓 ({remnantCount})
          </button>
        </div>

        <div className={styles.encyclopediaBody}>
          {activeTab === 'enemies' && (
            <EnemyTab
              enemies={enemyList}
              encountered={encounteredEnemyIds}
              encounters={enemyEncounters}
            />
          )}
          {activeTab === 'bosses' && (
            <BossTab
              bosses={bossList}
              encountered={encounteredBossIds}
              encounters={bossEncounters}
            />
          )}
          {activeTab === 'remnants' && (
            <RemnantTab
              remnants={remnantList}
              traded={tradedRemnantIds}
            />
          )}
        </div>
      </div>
    </div>
  );
});

interface EnemyTabProps {
  enemies: typeof ENEMY_TYPES[EnemyTypeId][];
  encountered: Set<EnemyTypeId>;
  encounters: Record<EnemyTypeId, { firstEncounterFloor: number; timesDefeated: number }>;
}

const EnemyTab = memo(function EnemyTab({ enemies, encountered, encounters }: EnemyTabProps) {
  return (
    <div className={styles.encyclopediaGrid}>
      {enemies.map((enemy) => {
        const isEncountered = encountered.has(enemy.id);
        const encounter = encounters[enemy.id];
        
        return (
          <div
            key={enemy.id}
            className={`${styles.encyclopediaCard} ${isEncountered ? '' : styles.encyclopediaCardLocked}`}
          >
            {isEncountered ? (
              <>
                <div className={styles.encyclopediaCardHeader}>
                  <h3 className={styles.encyclopediaCardName}>{enemy.displayName}</h3>
                  <span className={styles.encyclopediaCardNameSub}>{enemy.name}</span>
                </div>
                <div className={styles.encyclopediaCardDivider} />
                <div className={styles.encyclopediaCardStats}>
                  <div className={styles.encyclopediaStatRow}>
                    <span className={styles.encyclopediaStatLabel}>HP</span>
                    <span className={styles.encyclopediaStatValue}>{enemy.baseStats.maxHp}</span>
                  </div>
                  <div className={styles.encyclopediaStatRow}>
                    <span className={styles.encyclopediaStatLabel}>攻撃</span>
                    <span className={styles.encyclopediaStatValue}>{enemy.baseStats.attack}</span>
                  </div>
                  <div className={styles.encyclopediaStatRow}>
                    <span className={styles.encyclopediaStatLabel}>防御</span>
                    <span className={styles.encyclopediaStatValue}>{enemy.baseStats.defense}</span>
                  </div>
                </div>
                <div className={styles.encyclopediaCardDivider} />
                <div className={styles.encyclopediaCardMeta}>
                  <span>出現: {enemy.regions.map(getRegionName).join(', ')}</span>
                  <span>撃破数: {encounter?.timesDefeated ?? 0}</span>
                </div>
              </>
            ) : (
              <div className={styles.encyclopediaCardUnknown}>
                <span className={styles.encyclopediaCardUnknownIcon}>?</span>
                <span className={styles.encyclopediaCardUnknownText}>未発見</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

interface BossTabProps {
  bosses: typeof BOSS_TYPES[BossTypeId][];
  encountered: Set<BossTypeId>;
  encounters: Record<BossTypeId, { firstEncounterFloor: number; timesDefeated: number }>;
}

const BossTab = memo(function BossTab({ bosses, encountered, encounters }: BossTabProps) {
  return (
    <div className={styles.encyclopediaGrid}>
      {bosses.map((boss) => {
        const isEncountered = encountered.has(boss.id);
        const encounter = encounters[boss.id];
        const isDefeated = encounter?.timesDefeated > 0;
        
        return (
          <div
            key={boss.id}
            className={`${styles.encyclopediaCard} ${styles.encyclopediaCardBoss} ${isEncountered ? '' : styles.encyclopediaCardLocked}`}
          >
            {isEncountered ? (
              <>
                <div className={styles.encyclopediaCardHeader}>
                  <h3 className={styles.encyclopediaCardName}>{boss.displayName}</h3>
                  <span className={styles.encyclopediaCardNameSub}>{boss.name}</span>
                </div>
                <div className={styles.encyclopediaCardDivider} />
                <p className={styles.encyclopediaCardDesc}>{boss.description}</p>
                <div className={styles.encyclopediaCardDivider} />
                <div className={styles.encyclopediaCardStats}>
                  <div className={styles.encyclopediaStatRow}>
                    <span className={styles.encyclopediaStatLabel}>HP</span>
                    <span className={styles.encyclopediaStatValue}>{boss.baseStats.maxHp}</span>
                  </div>
                  <div className={styles.encyclopediaStatRow}>
                    <span className={styles.encyclopediaStatLabel}>攻撃</span>
                    <span className={styles.encyclopediaStatValue}>{boss.baseStats.attack}</span>
                  </div>
                  <div className={styles.encyclopediaStatRow}>
                    <span className={styles.encyclopediaStatLabel}>フェーズ</span>
                    <span className={styles.encyclopediaStatValue}>{boss.phases}</span>
                  </div>
                </div>
                <div className={styles.encyclopediaCardDivider} />
                <div className={styles.encyclopediaCardMeta}>
                  <span>領域: {getRegionName(boss.region)}</span>
                  <span>{isDefeated ? `撃破: ${encounter.timesDefeated}回` : '未撃破'}</span>
                </div>
              </>
            ) : (
              <div className={styles.encyclopediaCardUnknown}>
                <span className={styles.encyclopediaCardUnknownIcon}>?</span>
                <span className={styles.encyclopediaCardUnknownText}>未遭遇</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

interface RemnantTabProps {
  remnants: typeof REMNANTS[RemnantId][];
  traded: Set<RemnantId>;
}

const RemnantTab = memo(function RemnantTab({ remnants, traded }: RemnantTabProps) {
  return (
    <div className={styles.encyclopediaGrid}>
      {remnants.map((remnant) => {
        const isTraded = traded.has(remnant.id);
        
        return (
          <div
            key={remnant.id}
            className={`${styles.encyclopediaCard} ${styles.encyclopediaCardRemnant} ${isTraded ? '' : styles.encyclopediaCardLocked}`}
          >
            {isTraded ? (
              <>
                <div className={styles.encyclopediaCardHeader}>
                  <h3 className={styles.encyclopediaCardName}>{remnant.displayName}</h3>
                  <span className={styles.encyclopediaCardNameSub}>{remnant.oldNorse}</span>
                </div>
                <div className={styles.encyclopediaCardDivider} />
                <p className={styles.encyclopediaCardDesc}>{remnant.description}</p>
                <div className={styles.encyclopediaCardDivider} />
                <div className={styles.encyclopediaCardMeta}>
                  <span>領域: {getRegionName(remnant.region)}</span>
                </div>
                <div className={styles.encyclopediaCardDivider} />
                <div className={styles.encyclopediaCardQuote}>
                  "{remnant.dialogue.greeting}"
                </div>
              </>
            ) : (
              <div className={styles.encyclopediaCardUnknown}>
                <span className={styles.encyclopediaCardUnknownIcon}>?</span>
                <span className={styles.encyclopediaCardUnknownText}>未遭遇</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
