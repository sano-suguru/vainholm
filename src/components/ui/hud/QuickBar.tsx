import { memo } from 'react';
import { useShallow } from 'zustand/shallow';

import type { InventorySlot } from '../../../items/types';
import { isWeapon, isArmor } from '../../../items/types';
import { useInventoryStore } from '../../../items/inventoryStore';
import styles from '../../../styles/game.module.css';

const QUICKBAR_SLOTS = [0, 1, 2, 3] as const;

interface QuickBarSlotProps {
  slot: InventorySlot;
  hotkey: number;
}

const getItemDisplayInfo = (item: NonNullable<InventorySlot['item']>): { icon: string | null; name: string } => {
  if (isWeapon(item)) {
    return { icon: null, name: item.name };
  }
  if (isArmor(item)) {
    return { icon: null, name: item.name };
  }
  return { icon: item.icon, name: item.nameKey };
};

const QuickBarSlot = memo(function QuickBarSlot({ slot, hotkey }: QuickBarSlotProps) {
  const isEmpty = slot.item === null;
  const slotClassName = isEmpty
    ? `${styles.quickBarSlot} ${styles.quickBarSlotEmpty}`
    : styles.quickBarSlot;

  const { icon: displayIcon, name: displayName } = slot.item 
    ? getItemDisplayInfo(slot.item) 
    : { icon: null, name: '' };
  const placeholder = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <div className={slotClassName}>
      <span className={styles.quickBarHotkey}>{hotkey}</span>
      {!isEmpty && (
        <>
          <span className={styles.quickBarIcon}>
            {displayIcon || placeholder}
          </span>
          {slot.quantity > 1 && (
            <span className={styles.quickBarQuantity}>{slot.quantity}</span>
          )}
        </>
      )}
    </div>
  );
});

export const QuickBar = memo(function QuickBar() {
  const slots = useInventoryStore(
    useShallow((state) => QUICKBAR_SLOTS.map((index) => state.slots[index]))
  );

  return (
    <div className={styles.quickBar}>
      {QUICKBAR_SLOTS.map((slotIndex) => (
        <QuickBarSlot
          key={slotIndex}
          slot={slots[slotIndex]}
          hotkey={slotIndex + 1}
        />
      ))}
    </div>
  );
});
