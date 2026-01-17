import { memo } from 'react';

import type { Weapon } from '../../combat/types';

import { WEAPON_PATTERNS, WEAPON_PREMIUMS } from '../../combat/weapons';

import styles from '../../styles/game.module.css';

interface WeaponDropModalProps {
  weapon: Weapon;
  currentWeapon: Weapon | null;
  onEquip: () => void;
  onDiscard: () => void;
}

const TIER_COLORS: Record<Weapon['tier'], string> = {
  common: '#8a7a6a',
  rare: '#4a7a9a',
  legendary: '#c9a227',
};

const TIER_LABELS: Record<Weapon['tier'], string> = {
  common: '一般',
  rare: '希少',
  legendary: '伝説',
};

function WeaponCard({
  weapon,
  label,
  isDropped,
}: {
  weapon: Weapon;
  label?: string;
  isDropped?: boolean;
}) {
  const pattern = WEAPON_PATTERNS[weapon.typeId];
  const tierColor = TIER_COLORS[weapon.tier];

  return (
    <div
      className={styles.weaponDropCard}
      style={{ borderColor: isDropped ? tierColor : undefined }}
    >
      {label && <div className={styles.weaponDropCardLabel}>{label}</div>}
      <div className={styles.weaponDropCardHeader}>
        <span className={styles.weaponDropCardName}>{weapon.name}</span>
        <span
          className={styles.weaponDropCardTier}
          style={{ color: tierColor }}
        >
          {TIER_LABELS[weapon.tier]}
        </span>
      </div>
      <div className={styles.weaponDropCardDivider} />
      <div className={styles.weaponDropCardType}>{pattern.displayName}</div>
      <div className={styles.weaponDropCardAttack}>
        +{weapon.attackBonus} 攻撃力
      </div>
      {weapon.premiums.length > 0 && (
        <div className={styles.weaponDropCardPremiums}>
          {weapon.premiums.map((premiumId) => {
            const premium = WEAPON_PREMIUMS[premiumId];
            return (
              <span key={premiumId} className={styles.weaponDropCardPremium}>
                ✦ {premium.displayName}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const WeaponDropModal = memo(function WeaponDropModal({
  weapon,
  currentWeapon,
  onEquip,
  onDiscard,
}: WeaponDropModalProps) {
  return (
    <div className={styles.weaponDropOverlay}>
      <div className={styles.weaponDropModal}>
        <div className={styles.weaponDropHeader}>
          <div className={styles.weaponDropHeaderLine} />
          <h2 className={styles.weaponDropTitle}>武器を発見</h2>
          <div className={styles.weaponDropHeaderLine} />
        </div>

        <div className={styles.weaponDropContent}>
          <WeaponCard weapon={weapon} label="入手した武器" isDropped />

          {currentWeapon && (
            <>
              <div className={styles.weaponDropVs}>▼</div>
              <WeaponCard weapon={currentWeapon} label="現在の武器" />
            </>
          )}
        </div>

        <div className={styles.weaponDropActions}>
          <button
            type="button"
            className={styles.weaponDropButtonEquip}
            onClick={onEquip}
          >
            装備する
          </button>
          <button
            type="button"
            className={styles.weaponDropButtonDiscard}
            onClick={onDiscard}
          >
            捨てる
          </button>
        </div>
      </div>
    </div>
  );
});
