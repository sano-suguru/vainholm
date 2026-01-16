import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../../stores/gameStore';
import { useDungeonStore } from '../../../dungeon';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';
import { CombatLog } from './CombatLog';
import styles from '../../../styles/game.module.css';

export const Hud = memo(function Hud() {
  const { player, tick, combatLog } = useGameStore(
    useShallow((state) => ({
      player: state.player,
      tick: state.tick,
      combatLog: state.combatLog,
    }))
  );

  const { dungeon, isInDungeon, currentRegion } = useDungeonStore(
    useShallow((state) => ({
      dungeon: state.dungeon,
      isInDungeon: state.isInDungeon,
      currentRegion: state.getCurrentRegion(),
    }))
  );

  const currentFloor = dungeon?.currentFloor ?? 0;
  const maxFloors = dungeon?.maxFloors ?? 8;

  const regionName = currentRegion?.displayName ?? (isInDungeon ? 'Vainholm' : 'World');

  return (
    <div className={styles.hud}>
      <TopBar
        regionName={regionName}
        floorNumber={currentFloor}
        maxFloors={maxFloors}
        turn={tick}
        isInDungeon={isInDungeon}
      />
      <StatusBar
        hp={player.stats.hp}
        maxHp={player.stats.maxHp}
        attack={player.stats.attack}
        defense={player.stats.defense}
      />
      <CombatLog entries={combatLog} maxVisible={5} />
    </div>
  );
});
