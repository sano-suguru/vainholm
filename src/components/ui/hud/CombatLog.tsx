import { memo, useMemo } from 'react';

import type { CombatLogEntry } from '../../../combat/types';
import { m } from '../../../utils/i18nHelpers';
import styles from '../../../styles/game.module.css';

interface CombatLogProps {
  entries: CombatLogEntry[];
  maxVisible?: number;
}

function getEntryClassName(type: CombatLogEntry['type']): string {
  switch (type) {
    case 'player_attack':
      return styles.logDamageDealt;
    case 'enemy_attack':
      return styles.logDamageTaken;
    case 'player_death':
      return styles.logDeath;
    case 'enemy_death':
      return styles.logDamageDealt;
    default:
      return '';
  }
}

export const CombatLog = memo(function CombatLog({
  entries,
  maxVisible = 5,
}: CombatLogProps) {
  const visibleEntries = useMemo(
    () => entries.slice(-maxVisible).reverse(),
    [entries, maxVisible]
  );

  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <div className={styles.combatLog}>
      <div className={styles.combatLogHeader}>{m.ui_combat_log()}</div>
      {visibleEntries.map((entry) => (
        <div
          key={entry.id}
          className={`${styles.combatLogEntry} ${getEntryClassName(entry.type)}`}
        >
          {entry.message}
        </div>
      ))}
    </div>
  );
});
