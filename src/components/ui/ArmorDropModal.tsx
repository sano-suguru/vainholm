import { memo } from 'react';

import type { Armor } from '../../combat/types';

import { 
  getArmorGlowColor,
  ARMOR_GLOW_COLORS,
} from '../../combat/armor';
import { TIER_COLORS } from '../../combat/colors';
import { WEAPON_GLOW_COLORS } from '../../combat/weapons';
import { 
  m,
  getArmorPremiumDisplayName, 
  getPassivePremiumDisplayName, 
  getTierDisplayName,
} from '../../utils/i18nHelpers';

import styles from '../../styles/game.module.css';

interface ArmorDropModalProps {
  armor: Armor;
  currentArmor: Armor | null;
  onEquip: () => void;
  onAddToInventory?: () => void;
  onDiscard: () => void;
  isInventoryFull?: boolean;
}



const ArmorCard = memo(function ArmorCard({
  armor,
  label,
  isDropped,
}: {
  armor: Armor;
  label?: string;
  isDropped?: boolean;
}) {
  const tierColor = TIER_COLORS[armor.tier];
  const glowColor = getArmorGlowColor(armor);
  const glowColorHex = ARMOR_GLOW_COLORS[glowColor];

  return (
    <div
      className={styles.weaponDropCard}
      style={{ 
        borderColor: isDropped ? glowColorHex : undefined,
        boxShadow: isDropped ? `0 0 12px ${glowColorHex}40` : undefined,
      }}
    >
      {label && <div className={styles.weaponDropCardLabel}>{label}</div>}
      <div className={styles.weaponDropCardHeader}>
        <span className={styles.weaponDropCardName}>{armor.name}</span>
        <span
          className={styles.weaponDropCardTier}
          style={{ color: tierColor }}
        >
          {getTierDisplayName(armor.tier)}
        </span>
      </div>
      <div className={styles.weaponDropCardDivider} />
      <div className={styles.weaponDropCardType}>{m.ui_armor()}</div>
      <div className={styles.weaponDropCardAttack}>
        +{armor.defenseBonus} {m.ui_defense()}
      </div>
      {armor.premiums.length > 0 && (
        <div className={styles.weaponDropCardPremiums}>
          {armor.premiums.map((premiumId) => (
            <span key={premiumId} className={styles.weaponDropCardPremium} style={{ color: WEAPON_GLOW_COLORS.blue }}>
              ✦ {getArmorPremiumDisplayName(premiumId)}
            </span>
          ))}
        </div>
      )}
      {armor.passivePremiums.length > 0 && (
        <div className={styles.weaponDropCardPremiums}>
          {armor.passivePremiums.map((premiumId) => (
            <span key={premiumId} className={styles.weaponDropCardPremium} style={{ color: WEAPON_GLOW_COLORS.green }}>
              ◆ {getPassivePremiumDisplayName(premiumId)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export const ArmorDropModal = memo(function ArmorDropModal({
  armor,
  currentArmor,
  onEquip,
  onAddToInventory,
  onDiscard,
  isInventoryFull = false,
}: ArmorDropModalProps) {
  return (
    <div className={styles.weaponDropOverlay}>
      <div className={styles.weaponDropModal}>
        <div className={styles.weaponDropHeader}>
          <div className={styles.weaponDropHeaderLine} />
          <h2 className={styles.weaponDropTitle}>{m.ui_armor_found()}</h2>
          <div className={styles.weaponDropHeaderLine} />
        </div>

        <div className={styles.weaponDropContent}>
          <ArmorCard armor={armor} label={m.ui_dropped_armor()} isDropped />

          {currentArmor && (
            <>
              <div className={styles.weaponDropVs}>▼</div>
              <ArmorCard armor={currentArmor} label={m.ui_current_armor()} />
            </>
          )}
        </div>

        <div className={styles.weaponDropActions}>
          <button
            type="button"
            className={styles.weaponDropButtonEquip}
            onClick={onEquip}
          >
            {m.ui_equip()}
          </button>
          {onAddToInventory && (
            <button
              type="button"
              className={`${styles.weaponDropButtonInventory} ${isInventoryFull ? styles.weaponDropButtonDisabled : ''}`}
              onClick={onAddToInventory}
              disabled={isInventoryFull}
            >
              {isInventoryFull ? m.ui_inventory_full() : m.ui_add_to_inventory()}
            </button>
          )}
          <button
            type="button"
            className={styles.weaponDropButtonDiscard}
            onClick={onDiscard}
          >
            {m.ui_discard()}
          </button>
        </div>
      </div>
    </div>
  );
});
