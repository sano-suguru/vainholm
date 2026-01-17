import { memo, useMemo } from 'react';
import { Droplets, Flame, Zap, Eye, Footprints, Heart, Shield } from 'lucide-react';

import {
  status_blind,
  status_bleed,
  status_burn,
  status_invulnerable,
  status_poison,
  status_slow,
  status_stun,
} from '../../../paraglide/messages.js';

import type { StatusEffectId, StatusEffect } from '../../../combat/types';
import styles from '../../../styles/game.module.css';

interface StatusEffectsDisplayProps {
  statusEffects: Map<StatusEffectId, StatusEffect>;
}

const STATUS_EFFECT_CONFIG = {
  poison: { icon: Droplets, label: status_poison },
  bleed: { icon: Heart, label: status_bleed },
  burn: { icon: Flame, label: status_burn },
  stun: { icon: Zap, label: status_stun },
  slow: { icon: Footprints, label: status_slow },
  blind: { icon: Eye, label: status_blind },
  invulnerable: { icon: Shield, label: status_invulnerable },
} satisfies Record<StatusEffectId, { icon: typeof Droplets; label: () => string }>;

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
        const config = STATUS_EFFECT_CONFIG[id];
        if (!config) return null;
        const IconComponent = config.icon;
        const statusClassName = styles[`statusEffect_${id}` as keyof typeof styles];
        return (
          <div
            key={id}
            className={`${styles.statusEffectIcon} ${statusClassName}`}
            title={`${config.label()} (${effect.duration}ターン)`}
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
