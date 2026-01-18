import { memo, useCallback, useState } from 'react';

import type { BackgroundId, CharacterClassId } from '../../combat/types';
import type { GameMode } from '../../dungeon/types';

import { BACKGROUNDS, BACKGROUND_IDS } from '../../combat/backgrounds';
import { CLASSES, CLASS_IDS } from '../../combat/classes';
import { useMetaProgressionStore } from '../../stores/metaProgressionStore';
import { useDungeonStore } from '../../dungeon';
import { m } from '../../utils/i18nHelpers';
import styles from '../../styles/game.module.css';

interface CharacterSelectionScreenProps {
  onConfirm: (classId: CharacterClassId, backgroundId: BackgroundId, gameMode: GameMode) => void;
}

const CLASS_SYMBOLS: Record<CharacterClassId, string> = {
  warrior: '⚔',
  hunter: '◎',
  scholar: '✦',
};

const BACKGROUND_SYMBOLS: Record<BackgroundId, string> = {
  fallen_noble: '♛',
  orphan: '◇',
  ex_soldier: '⛨',
  herbalist_apprentice: '❧',
  thief_child: '◈',
  temple_raised: '✝',
};

export const CharacterSelectionScreen = memo(function CharacterSelectionScreen({
  onConfirm,
}: CharacterSelectionScreenProps) {
  const advancedModeUnlocked = useMetaProgressionStore((state) => state.advancedModeUnlocked);
  const collapseEnabled = useDungeonStore((state) => state.collapseEnabled);
  const setCollapseEnabled = useDungeonStore((state) => state.setCollapseEnabled);
  const [selectedMode, setSelectedMode] = useState<GameMode>('normal');
  const [selectedClass, setSelectedClass] = useState<CharacterClassId | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundId | null>(null);

  const handleClassSelect = useCallback((classId: CharacterClassId) => {
    setSelectedClass(classId);
  }, []);

  const handleBackgroundSelect = useCallback((backgroundId: BackgroundId) => {
    setSelectedBackground(backgroundId);
  }, []);

  const handleModeSelect = useCallback((mode: GameMode) => {
    if (mode === 'advanced' && !advancedModeUnlocked) return;
    setSelectedMode(mode);
  }, [advancedModeUnlocked]);

  const handleConfirm = useCallback(() => {
    if (selectedClass && selectedBackground) {
      onConfirm(selectedClass, selectedBackground, selectedMode);
    }
  }, [selectedClass, selectedBackground, selectedMode, onConfirm]);

  const canConfirm = selectedClass !== null && selectedBackground !== null;

  return (
    <div className={styles.characterSelectOverlay}>
      <div className={styles.characterSelectModal}>
        <div className={styles.levelUpHeader}>
          <div className={styles.levelUpHeaderLine} />
          <h2 className={styles.levelUpTitle}>旅人の選択</h2>
          <div className={styles.levelUpHeaderLine} />
        </div>
        <p className={styles.levelUpSubtitle}>己の宿命を定めよ</p>

        <div className={styles.characterSelectSection}>
          <h3 className={styles.characterSelectSectionTitle}>冒険の難度</h3>
          <div className={styles.characterSelectCardGrid3}>
            <button
              className={`${styles.characterSelectCard} ${selectedMode === 'normal' ? styles.characterSelectCardSelected : ''}`}
              onClick={() => handleModeSelect('normal')}
              type="button"
            >
              <div className={styles.characterSelectCardInner}>
                <span className={styles.characterSelectCardSymbol}>◆</span>
                <h4 className={styles.characterSelectCardName}>通常モード</h4>
                <div className={styles.levelUpCardDivider} />
                <p className={styles.characterSelectCardDesc}>8階層の試練 (4地域×2階)</p>
              </div>
              {selectedMode === 'normal' && <div className={styles.characterSelectCardGlow} />}
            </button>
            <button
              className={`${styles.characterSelectCard} ${selectedMode === 'advanced' ? styles.characterSelectCardSelected : ''} ${!advancedModeUnlocked ? styles.characterSelectConfirmDisabled : ''}`}
              onClick={() => handleModeSelect('advanced')}
              disabled={!advancedModeUnlocked}
              type="button"
            >
              <div className={styles.characterSelectCardInner}>
                <span className={styles.characterSelectCardSymbol}>◇</span>
                <h4 className={styles.characterSelectCardName}>
                  上級モード{!advancedModeUnlocked && ' (未解放)'}
                </h4>
                <div className={styles.levelUpCardDivider} />
                <p className={styles.characterSelectCardDesc}>16階層の深淵 (4地域×4階)</p>
              </div>
              {selectedMode === 'advanced' && <div className={styles.characterSelectCardGlow} />}
            </button>
          </div>
          <div className={styles.characterSelectCollapseToggle}>
            <label className={styles.characterSelectToggleLabel}>
              <input
                type="checkbox"
                checked={collapseEnabled}
                onChange={(e) => {
                  setCollapseEnabled(e.target.checked);
                }}
                className={styles.characterSelectToggleInput}
              />
              <span className={styles.characterSelectToggleText}>
                {collapseEnabled ? m.ui_collapse_system_on() : m.ui_collapse_system_off()}
              </span>
              <span className={styles.characterSelectToggleHint}>
                {collapseEnabled ? m.ui_collapse_hint_on() : m.ui_collapse_hint_off()}
              </span>
            </label>
          </div>
        </div>

        <div className={styles.characterSelectSection}>
          <h3 className={styles.characterSelectSectionTitle}>職業</h3>
          <div className={styles.characterSelectCardGrid3}>
            {CLASS_IDS.map((classId) => {
              const charClass = CLASSES[classId];
              const isSelected = selectedClass === classId;
              return (
                <button
                  key={classId}
                  className={`${styles.characterSelectCard} ${isSelected ? styles.characterSelectCardSelected : ''}`}
                  onClick={() => handleClassSelect(classId)}
                  type="button"
                >
                  <div className={styles.characterSelectCardInner}>
                    <span className={styles.characterSelectCardSymbol}>
                      {CLASS_SYMBOLS[classId]}
                    </span>
                    <h4 className={styles.characterSelectCardName}>{charClass.displayName}</h4>
                    <div className={styles.levelUpCardDivider} />
                    <p className={styles.characterSelectCardDesc}>{charClass.description}</p>
                    <div className={styles.characterSelectCardStats}>
                      {charClass.statModifiers.hp !== 0 && (
                        <span className={charClass.statModifiers.hp > 0 ? styles.statPositive : styles.statNegative}>
                          HP{charClass.statModifiers.hp > 0 ? '+' : ''}{charClass.statModifiers.hp}
                        </span>
                      )}
                      {charClass.statModifiers.attack !== 0 && (
                        <span className={styles.statPositive}>
                          攻撃+{charClass.statModifiers.attack}
                        </span>
                      )}
                      {charClass.statModifiers.defense !== 0 && (
                        <span className={styles.statPositive}>
                          防御+{charClass.statModifiers.defense}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <div className={styles.characterSelectCardGlow} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.characterSelectSection}>
          <h3 className={styles.characterSelectSectionTitle}>出自</h3>
          <div className={styles.characterSelectCardGrid6}>
            {BACKGROUND_IDS.map((backgroundId) => {
              const background = BACKGROUNDS[backgroundId];
              const isSelected = selectedBackground === backgroundId;
              return (
                <button
                  key={backgroundId}
                  className={`${styles.characterSelectCard} ${styles.characterSelectCardSmall} ${isSelected ? styles.characterSelectCardSelected : ''}`}
                  onClick={() => handleBackgroundSelect(backgroundId)}
                  type="button"
                >
                  <div className={styles.characterSelectCardInner}>
                    <span className={styles.characterSelectCardSymbolSmall}>
                      {BACKGROUND_SYMBOLS[backgroundId]}
                    </span>
                    <h4 className={styles.characterSelectCardNameSmall}>{background.displayName}</h4>
                    <p className={styles.characterSelectCardDescSmall}>{background.description}</p>
                  </div>
                  {isSelected && <div className={styles.characterSelectCardGlow} />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className={`${styles.characterSelectConfirmButton} ${canConfirm ? '' : styles.characterSelectConfirmDisabled}`}
          onClick={handleConfirm}
          disabled={!canConfirm}
          type="button"
        >
          {canConfirm ? '深淵へ踏み出す' : '職業と出自を選択せよ'}
        </button>
      </div>
    </div>
  );
});
