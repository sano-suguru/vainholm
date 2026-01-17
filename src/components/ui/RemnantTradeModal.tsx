import { memo } from 'react';

import type {
  RemnantBenefit,
  RemnantCost,
  RemnantDefinition,
  RemnantTrade,
} from '../../progression/remnants';

import styles from '../../styles/game.module.css';

interface RemnantTradeModalProps {
  remnant: RemnantDefinition;
  onAcceptTrade: (trade: RemnantTrade) => void;
  onDecline: () => void;
}

function getBenefitDescription(benefit: RemnantBenefit): string {
  switch (benefit.type) {
    case 'reveal_next_region':
      return '次の領域のマップを全て開示する';
    case 'stat_buff':
      return `${benefit.stat === 'attack' ? '攻撃力' : '防御力'}+${benefit.amount}（${benefit.duration === -1 ? 'この階のみ' : `${benefit.duration}ターン`}）`;
    case 'grant_relic':
      return '遺物を授かる';
    case 'full_heal':
      return 'HPを完全回復する';
    case 'reveal_traps':
      return 'この階の全ての罠を可視化する';
    case 'temporary_invulnerability':
      return `${benefit.turns}ターンの無敵状態を得る`;
  }
}

function getCostDescription(cost: RemnantCost): string {
  switch (cost.type) {
    case 'vision_reduction':
      return `視界範囲-${cost.amount}${cost.permanent ? '（永続）' : '（この階のみ）'}`;
    case 'max_hp_reduction':
      return `最大HP-${cost.amount}${cost.permanent ? '（永続）' : '（この階のみ）'}`;
    case 'movement_penalty':
      return `${cost.turns}ターンの移動制限`;
    case 'hp_damage':
      return `${cost.amount}ダメージを受ける`;
    case 'random_stat_loss':
      return `ランダムなステータス-${cost.amount}`;
  }
}

export const RemnantTradeModal = memo(function RemnantTradeModal({
  remnant,
  onAcceptTrade,
  onDecline,
}: RemnantTradeModalProps) {
  return (
    <div className={styles.remnantTradeOverlay}>
      <div className={styles.remnantTradeModal}>
        <div className={styles.remnantTradeHeader}>
          <div className={styles.remnantTradeHeaderLine} />
          <div className={styles.remnantTradeNames}>
            <h2 className={styles.remnantTradeTitle}>{remnant.displayName}</h2>
            <span className={styles.remnantTradeOldNorse}>{remnant.oldNorse}</span>
          </div>
          <div className={styles.remnantTradeHeaderLine} />
        </div>

        <div className={styles.remnantTradeDialogue}>
          <span className={styles.remnantTradeQuoteMark}>"</span>
          {remnant.dialogue.greeting}
          <span className={styles.remnantTradeQuoteMark}>"</span>
        </div>

        <div className={styles.remnantTradeList}>
          {remnant.trades.map((trade) => (
            <div key={trade.id} className={styles.remnantTradeItem}>
              <div className={styles.remnantTradeItemDesc}>{trade.description}</div>
              <div className={styles.remnantTradeItemDivider} />
              <div className={styles.remnantTradeBenefit}>
                <span className={styles.remnantTradeLabel}>得るもの</span>
                {getBenefitDescription(trade.benefit)}
              </div>
              <div className={styles.remnantTradeCost}>
                <span className={styles.remnantTradeLabel}>代償</span>
                {getCostDescription(trade.cost)}
              </div>
              <button
                type="button"
                className={styles.remnantTradeButtonAccept}
                onClick={() => onAcceptTrade(trade)}
              >
                取引する
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={styles.remnantTradeButtonDecline}
          onClick={onDecline}
        >
          立ち去る
        </button>
      </div>
    </div>
  );
});
