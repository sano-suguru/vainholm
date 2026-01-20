import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../stores/gameStore';
import { useDungeonStore } from '../../../dungeon';
import {
  getLocalizedRegionName,
  getLocalizedUnknownRegionName,
  getLocalizedWorldName,
} from '../../../utils/i18n';
import { TopBar } from './TopBar';
import { StatusEffectsDisplay } from './StatusEffectsDisplay';
import { CombatLog } from './CombatLog';
import { BossHealthBar } from './BossHealthBar';
import { QuickBar } from './QuickBar';
import { Sidebar } from './Sidebar';
import styles from '../../../styles/game.module.css';

interface HudProps {
  onEquipmentClick?: () => void;
}

export const Hud = memo(function Hud({ onEquipmentClick }: HudProps) {
  const { player, tick, combatLog } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      tick: state.tick,
      combatLog: state.combatLog,
    }))
  );

  const { dungeon, isInDungeon, getTurnsUntilCollapse, dungeonSeed } = useDungeonStore(
    useShallow((state) => ({
      dungeon: state.dungeon,
      isInDungeon: state.isInDungeon,
      getTurnsUntilCollapse: state.getTurnsUntilCollapse,
      dungeonSeed: state.dungeon?.baseSeed ?? null,
    }))
  );

  const currentRegion = useDungeonStore((state) => state.getCurrentRegion());
  const turnsUntilCollapse = isInDungeon ? getTurnsUntilCollapse(tick) : null;

  const currentFloor = dungeon?.currentFloor ?? 0;
  const maxFloors = dungeon?.maxFloors ?? 8;

  const regionName = isInDungeon
    ? currentRegion?.theme
      ? getLocalizedRegionName(currentRegion.theme)
      : getLocalizedUnknownRegionName()
    : getLocalizedWorldName();

  return (
    <div className={styles.hud}>
      <TopBar
        regionName={regionName}
        floorNumber={currentFloor}
        maxFloors={maxFloors}
        turn={tick}
        isInDungeon={isInDungeon}
        turnsUntilCollapse={turnsUntilCollapse}
        dungeonSeed={dungeonSeed}
      />
      <StatusEffectsDisplay statusEffects={player.statusEffects} />
      <BossHealthBar />
      <CombatLog entries={combatLog} />
      <Sidebar onEquipmentClick={onEquipmentClick} />
      <QuickBar />
    </div>
  );
});
