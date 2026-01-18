import { memo, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';

import type { Weapon, Armor } from '../../combat/types';
import type { InventoryItem } from '../../items/types';
import { isWeapon, isArmor, isConsumable, INVENTORY_SIZE } from '../../items/types';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../items/inventoryStore';
import { WEAPON_GLOW_COLORS, getWeaponGlowColor } from '../../combat/weapons';
import { getArmorGlowColor } from '../../combat/armor';
import {
  m,
  getWeaponTypeDisplayName,
  getWeaponPremiumDisplayName,
  getPassivePremiumDisplayName,
  getArmorPremiumDisplayName,
  getTierDisplayName,
} from '../../utils/i18nHelpers';
import styles from '../../styles/game.module.css';

interface EquipmentScreenProps {
  onClose: () => void;
}



const WeaponSlot = memo(function WeaponSlot({ 
  weapon, 
  onUnequip 
}: { 
  weapon: Weapon | null; 
  onUnequip: () => void;
}) {
  if (!weapon) {
    return (
      <div className={styles.equipmentSlot}>
        <div className={styles.equipmentSlotLabel}>{m.ui_weapon()}</div>
        <div className={styles.equipmentSlotEmpty}>{m.ui_none()}</div>
      </div>
    );
  }

  const glowColor = getWeaponGlowColor(weapon);
  const glowColorHex = WEAPON_GLOW_COLORS[glowColor];

  return (
    <div 
      className={styles.equipmentSlot}
      style={{ borderColor: glowColorHex }}
    >
      <div className={styles.equipmentSlotLabel}>{m.ui_weapon()}</div>
      <div className={styles.equipmentSlotName}>{weapon.name}</div>
      <div className={styles.equipmentSlotType}>{getWeaponTypeDisplayName(weapon.typeId)} +{weapon.attackBonus}</div>
      {weapon.premiums.length > 0 && (
        <div className={styles.equipmentSlotPremiums}>
          {weapon.premiums.map((id) => (
            <span key={id} style={{ color: WEAPON_GLOW_COLORS.blue }}>
              ✦ {getWeaponPremiumDisplayName(id)}
            </span>
          ))}
        </div>
      )}
      {weapon.passivePremiums.length > 0 && (
        <div className={styles.equipmentSlotPremiums}>
          {weapon.passivePremiums.map((id) => (
            <span key={id} style={{ color: WEAPON_GLOW_COLORS.green }}>
              ◆ {getPassivePremiumDisplayName(id)}
            </span>
          ))}
        </div>
      )}
      <button 
        type="button"
        className={styles.equipmentSlotUnequip}
        onClick={onUnequip}
      >
        {m.ui_unequip()}
      </button>
    </div>
  );
});

const ArmorSlot = memo(function ArmorSlot({ 
  armor, 
  onUnequip 
}: { 
  armor: Armor | null; 
  onUnequip: () => void;
}) {
  if (!armor) {
    return (
      <div className={styles.equipmentSlot}>
        <div className={styles.equipmentSlotLabel}>{m.ui_armor()}</div>
        <div className={styles.equipmentSlotEmpty}>{m.ui_none()}</div>
      </div>
    );
  }

  const glowColor = getArmorGlowColor(armor);
  const glowColorHex = WEAPON_GLOW_COLORS[glowColor];

  return (
    <div 
      className={styles.equipmentSlot}
      style={{ borderColor: glowColorHex }}
    >
      <div className={styles.equipmentSlotLabel}>{m.ui_armor()}</div>
      <div className={styles.equipmentSlotName}>{armor.name}</div>
      <div className={styles.equipmentSlotType}>{m.ui_defense_bonus({ bonus: armor.defenseBonus })}</div>
      {armor.premiums.length > 0 && (
        <div className={styles.equipmentSlotPremiums}>
          {armor.premiums.map((id) => (
            <span key={id} style={{ color: WEAPON_GLOW_COLORS.blue }}>
              ✦ {getArmorPremiumDisplayName(id)}
            </span>
          ))}
        </div>
      )}
      {armor.passivePremiums.length > 0 && (
        <div className={styles.equipmentSlotPremiums}>
          {armor.passivePremiums.map((id) => (
            <span key={id} style={{ color: WEAPON_GLOW_COLORS.green }}>
              ◆ {getPassivePremiumDisplayName(id)}
            </span>
          ))}
        </div>
      )}
      <button 
        type="button"
        className={styles.equipmentSlotUnequip}
        onClick={onUnequip}
      >
        {m.ui_unequip()}
      </button>
    </div>
  );
});

const getItemDisplayName = (item: InventoryItem): string => {
  if (isWeapon(item) || isArmor(item)) {
    return item.name;
  }
  return item.nameKey;
};

const getItemTier = (item: InventoryItem): string | null => {
  if (isWeapon(item) || isArmor(item)) {
    return getTierDisplayName(item.tier);
  }
  return null;
};

const InventoryItemRow = memo(function InventoryItemRow({
  item,
  quantity,
  slotIndex,
  onEquip,
  onUse,
  onDrop,
}: {
  item: InventoryItem;
  quantity: number;
  slotIndex: number;
  onEquip: (slotIndex: number) => void;
  onUse: (slotIndex: number) => void;
  onDrop: (slotIndex: number) => void;
}) {
  const name = getItemDisplayName(item);
  const tier = getItemTier(item);
  const canEquip = isWeapon(item) || isArmor(item);
  const canUse = isConsumable(item);

  let glowColorHex: string | undefined;
  if (isWeapon(item)) {
    glowColorHex = WEAPON_GLOW_COLORS[getWeaponGlowColor(item)];
  } else if (isArmor(item)) {
    glowColorHex = WEAPON_GLOW_COLORS[getArmorGlowColor(item)];
  }

  return (
    <div 
      className={styles.inventoryRow}
      style={{ borderLeftColor: glowColorHex }}
    >
      <div className={styles.inventoryRowInfo}>
        <span className={styles.inventoryRowName}>
          {name}
          {quantity > 1 && <span className={styles.inventoryRowQuantity}> x{quantity}</span>}
        </span>
        {tier && <span className={styles.inventoryRowTier}>{tier}</span>}
      </div>
      <div className={styles.inventoryRowActions}>
        {canEquip && (
          <button type="button" onClick={() => onEquip(slotIndex)}>{m.ui_equip()}</button>
        )}
        {canUse && (
          <button type="button" onClick={() => onUse(slotIndex)}>{m.ui_use()}</button>
        )}
        <button type="button" onClick={() => onDrop(slotIndex)}>{m.ui_discard()}</button>
      </div>
    </div>
  );
});

export const EquipmentScreen = memo(function EquipmentScreen({ onClose }: EquipmentScreenProps) {
  const { weapon, armor } = useGameStore(
    useShallow((state) => ({
      weapon: state.player.weapon,
      armor: state.player.armor,
    }))
  );

  const equipWeapon = useGameStore((state) => state.equipWeapon);
  const equipArmor = useGameStore((state) => state.equipArmor);

  const { slots, removeItem, consumeItem } = useInventoryStore(
    useShallow((state) => ({
      slots: state.slots,
      removeItem: state.removeItem,
      consumeItem: state.consumeItem,
    }))
  );

  const addItem = useInventoryStore((state) => state.addItem);

  const handleUnequipWeapon = useCallback(() => {
    if (!weapon) return;
    const added = addItem(weapon);
    if (added) {
      useGameStore.setState((state) => ({
        player: { ...state.player, weapon: null },
      }));
    }
  }, [weapon, addItem]);

  const handleUnequipArmor = useCallback(() => {
    if (!armor) return;
    const added = addItem(armor);
    if (added) {
      useGameStore.setState((state) => ({
        player: { ...state.player, armor: null },
      }));
    }
  }, [armor, addItem]);

  const handleEquip = useCallback((slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot?.item) return;

    const itemToEquip = slot.item;
    const currentWeapon = useGameStore.getState().player.weapon;
    const currentArmor = useGameStore.getState().player.armor;

    if (isWeapon(itemToEquip)) {
      removeItem(slotIndex);
      if (currentWeapon) {
        addItem(currentWeapon);
      }
      equipWeapon(itemToEquip);
    } else if (isArmor(itemToEquip)) {
      removeItem(slotIndex);
      if (currentArmor) {
        addItem(currentArmor);
      }
      equipArmor(itemToEquip);
    }
  }, [slots, addItem, removeItem, equipWeapon, equipArmor]);

  const handleUse = useCallback((slotIndex: number) => {
    consumeItem(slotIndex);
  }, [consumeItem]);

  const handleDrop = useCallback((slotIndex: number) => {
    removeItem(slotIndex);
  }, [removeItem]);

  const nonEmptySlots = slots
    .map((slot, index) => ({ ...slot, index }))
    .filter((slot) => slot.item !== null);

  return (
    <div className={styles.equipmentOverlay}>
      <div className={styles.equipmentModal}>
        <div className={styles.equipmentHeader}>
          <h2 className={styles.equipmentTitle}>{m.ui_equipment()}</h2>
          <button 
            type="button" 
            className={styles.equipmentCloseButton}
            onClick={onClose}
          >
            {m.ui_close_with_e()}
          </button>
        </div>

        <div className={styles.equipmentContent}>
          <div className={styles.equipmentSlotsSection}>
            <WeaponSlot weapon={weapon} onUnequip={handleUnequipWeapon} />
            <ArmorSlot armor={armor} onUnequip={handleUnequipArmor} />
          </div>

          <div className={styles.equipmentDivider} />

          <div className={styles.inventorySection}>
            <div className={styles.inventorySectionHeader}>
              {m.ui_inventory_count({ count: nonEmptySlots.length, max: INVENTORY_SIZE })}
            </div>
            {nonEmptySlots.length === 0 ? (
              <div className={styles.inventoryEmpty}>{m.ui_no_items()}</div>
            ) : (
              <div className={styles.inventoryList}>
                {nonEmptySlots.map((slot) => (
                  <InventoryItemRow
                    key={slot.index}
                    item={slot.item!}
                    quantity={slot.quantity}
                    slotIndex={slot.index}
                    onEquip={handleEquip}
                    onUse={handleUse}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
