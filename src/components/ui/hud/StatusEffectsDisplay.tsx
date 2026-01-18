import { memo, useMemo } from 'react';
import { Droplets, Flame, Zap, Eye, Footprints, Heart, Shield } from 'lucide-react';

import type { StatusEffectId, StatusEffect } from '../../../combat/types';
import { getStatusEffectDisplayName } from '../../../utils/i18nHelpers';
import styles from '../../../styles/game.module.css';

interface StatusEffectsDisplayProps {
  statusEffects: Map<StatusEffectId, StatusEffect>;
}

const STATUS_EFFECT_ICONS: Record<StatusEffectId, typeof Droplets> = {
  poison: Droplets,
  bleed: Heart,
  burn: Flame,
  stun: Zap,
  slow: Footprints,
  blind: Eye,
  invulnerable: Shield,
};

export const StatusEffectsDisplay = memo(function StatusEffectsDisplay({
  statusEffects,
}: StatusEffectsDisplayProps) {
  const effectsList = useMemo(
    () => Array.from(statusEffects.entries()),
    [statusEffects]
  );

  if (effectsList.length === 0) return null;

  return (
    <div className={styles.statusEffectsContainer}>
      {effectsList.map(([id, effect]) => {
        const IconComponent = STATUS_EFFECT_ICONS[id];
        if (!IconComponent) return null;
        const statusClassName = styles[`statusEffect_${id}` as keyof typeof styles];
        return (
          <div
            key={id}
            className={`${styles.statusEffectIcon} ${statusClassName}`}
            title={`${getStatusEffectDisplayName(id)} (${effect.duration})`}
          >
            <IconComponent size={14} color="currentColor" />
            {effect.duration > 0 && (
              <span className={styles.statusEffectDuration}>{effect.duration}</span>
            )}
            {effect.stacks > 1 && (
              <span className={styles.statusEffectStacks}>x{effect.stacks}</span>
            )}
          </div>
        );
      })}
    </div>
  );
});
