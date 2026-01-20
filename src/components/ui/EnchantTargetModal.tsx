import { memo } from 'react';

import type { Weapon, Armor } from '../../combat/types';

import { TIER_COLORS } from '../../combat/colors';
import { 
  getWeaponGlowColor,
  WEAPON_GLOW_COLORS,
  ENCHANTABLE_WEAPON_PREMIUM_IDS,
} from '../../combat/weapons';
import { ENCHANTABLE_ARMOR_PREMIUM_IDS } from '../../combat/armor';
import { 
  m,
  getWeaponTypeDisplayName,
  getWeaponPremiumDisplayName, 
  getArmorPremiumDisplayName,
  getTierDisplayName,
  getArmorTierName,
} from '../../utils/i18nHelpers';

import styles from '../../styles/game.module.css';

interface EnchantTargetModalProps {
  weapon: Weapon | null;
  armor: Armor | null;
  onEnchantWeapon: () => void;
  onEnchantArmor: () => void;
  onCancel: () => void;
}

const WeaponEnchantCard = memo(function WeaponEnchantCard({
  weapon,
  onEnchant,
}: {
  weapon: Weapon;
  onEnchant: () => void;
}) {
  const tierColor = TIER_COLORS[weapon.tier];
  const glowColor = getWeaponGlowColor(weapon);
  const glowColorHex = WEAPON_GLOW_COLORS[glowColor];
  
  const unusedPremiums = ENCHANTABLE_WEAPON_PREMIUM_IDS.filter(p => !weapon.premiums.includes(p));
  const canEnchant = unusedPremiums.length > 0;

  return (
    <div
      className={styles.enchantCard}
      style={{ 
        borderColor: glowColorHex,
        boxShadow: `0 0 12px ${glowColorHex}40`,
      }}
    >
      <div className={styles.enchantCardLabel}>{m.ui_weapon()}</div>
      <div className={styles.enchantCardHeader}>
        <span className={styles.enchantCardName}>{weapon.name}</span>
        <span
          className={styles.enchantCardTier}
          style={{ color: tierColor }}
        >
          {getTierDisplayName(weapon.tier)}
        </span>
      </div>
      <div className={styles.enchantCardDivider} />
      <div className={styles.enchantCardType}>{getWeaponTypeDisplayName(weapon.typeId)}</div>
      <div className={styles.enchantCardStat}>
        +{weapon.attackBonus} {m.ui_attack_power()}
      </div>
      {weapon.premiums.length > 0 && (
        <div className={styles.enchantCardPremiums}>
          {weapon.premiums.map((premiumId) => (
            <span key={premiumId} className={styles.enchantCardPremium} style={{ color: WEAPON_GLOW_COLORS.blue }}>
              ✦ {getWeaponPremiumDisplayName(premiumId)}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${styles.enchantButton} ${!canEnchant ? styles.enchantButtonDisabled : ''}`}
        onClick={onEnchant}
        disabled={!canEnchant}
      >
        {canEnchant ? m.ui_enchant() : m.ui_enchant_max()}
      </button>
    </div>
  );
});

const ArmorEnchantCard = memo(function ArmorEnchantCard({
  armor,
  onEnchant,
}: {
  armor: Armor;
  onEnchant: () => void;
}) {
  const tierColor = TIER_COLORS[armor.tier];
  
  const unusedPremiums = ENCHANTABLE_ARMOR_PREMIUM_IDS.filter(p => !armor.premiums.includes(p));
  const canEnchant = unusedPremiums.length > 0;

  return (
    <div
      className={styles.enchantCard}
      style={{ 
        borderColor: tierColor,
        boxShadow: `0 0 12px ${tierColor}40`,
      }}
    >
      <div className={styles.enchantCardLabel}>{m.ui_armor()}</div>
      <div className={styles.enchantCardHeader}>
        <span className={styles.enchantCardName}>{getArmorTierName(armor.tier)}</span>
        <span
          className={styles.enchantCardTier}
          style={{ color: tierColor }}
        >
          {getTierDisplayName(armor.tier)}
        </span>
      </div>
      <div className={styles.enchantCardDivider} />
      <div className={styles.enchantCardStat}>
        +{armor.defenseBonus} {m.ui_defense()}
      </div>
      {armor.premiums.length > 0 && (
        <div className={styles.enchantCardPremiums}>
          {armor.premiums.map((premiumId) => (
            <span key={premiumId} className={styles.enchantCardPremium} style={{ color: '#8aad8a' }}>
              ◆ {getArmorPremiumDisplayName(premiumId)}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${styles.enchantButton} ${!canEnchant ? styles.enchantButtonDisabled : ''}`}
        onClick={onEnchant}
        disabled={!canEnchant}
      >
        {canEnchant ? m.ui_enchant() : m.ui_enchant_max()}
      </button>
    </div>
  );
});

export const EnchantTargetModal = memo(function EnchantTargetModal({
  weapon,
  armor,
  onEnchantWeapon,
  onEnchantArmor,
  onCancel,
}: EnchantTargetModalProps) {
  return (
    <div className={styles.enchantOverlay}>
      <div className={styles.enchantModal}>
        <div className={styles.enchantHeader}>
          <div className={styles.enchantHeaderLine} />
          <h2 className={styles.enchantTitle}>{m.ui_enchant_title()}</h2>
          <div className={styles.enchantHeaderLine} />
        </div>

        <div className={styles.enchantContent}>
          {weapon && (
            <WeaponEnchantCard weapon={weapon} onEnchant={onEnchantWeapon} />
          )}
          {armor && (
            <ArmorEnchantCard armor={armor} onEnchant={onEnchantArmor} />
          )}
          {!weapon && !armor && (
            <div className={styles.enchantNoEquipment}>
              {m.ui_enchant_no_equipment()}
            </div>
          )}
        </div>

        <div className={styles.enchantActions}>
          <button
            type="button"
            className={styles.enchantButtonCancel}
            onClick={onCancel}
          >
            {m.ui_cancel()}
          </button>
        </div>
      </div>
    </div>
  );
});
