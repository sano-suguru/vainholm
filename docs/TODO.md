# TODO

## 実装優先度

### Phase A: プレミアムシステム拡張 ✅ (2026-01-18)

ハクスラ要素の核心。既存の武器プレミアムを拡張し、二層構造を導入。

- [x] 緑プレミアム（所持効果）の型定義追加 (`combat/types.ts`)
- [x] 緑プレミアム効果の実装（HP+、視界+、罠感知、忍び足）
- [x] 武器プレミアム調整：`かず+N`（攻撃回数）の追加
- [x] 武器プレミアム調整：`貫通`（敵貫通攻撃）の追加
- [x] ドロップ時の光色表示（白/青/緑/青緑/金）
- [x] 防具システムの基盤実装（防具タイプ、スロット）
- [x] 防具プレミアム（青）の実装（物理耐性、属性耐性、反射、棘）
- [x] 強化の巻物の実装（希少アイテム、プレミアム枠追加）
- [x] 装備画面（EquipmentScreen）の実装 - Brogue風統合ビュー
- [x] キーボードショートカット（E）で装備画面の開閉
- [x] Sidebar EQUIPMENTセクションのクリックで装備画面を開く
- [x] ホバー時の[E]ヒント表示
- [x] 武器/防具ドロップモーダルに「持ち物に入れる」オプション追加
- [x] ArmorDropModal（防具ドロップ時の比較・選択UI）の実装
- [x] インベントリへの武器/防具格納対応

### Phase B: 崩壊システム ✅ (2026-01-18)

片道勇者要素の核心。時間制約による緊張感を導入。

- [x] 崩壊状態の型定義追加 (`dungeon/types.ts`)
  - `COLLAPSE_CONSTANTS` (START_TICK: 200, TICKS_PER_FLOOR: 50)
  - `getCollapsedFloor()`, `getTurnsUntilCollapse()`, `isPlayerCaughtByCollapse()`
- [x] dungeonStoreに崩壊進行ロジック追加
  - `collapseEnabled` フラグ
  - `getCollapsedFloor()`, `getTurnsUntilCollapse()`, `isFloorCollapsed()`, `checkCollapseGameOver()`
- [x] 崩壊開始トリガー（200ターン後）
- [x] 崩壊速度設定（50ターン/1F）
- [x] 崩壊したフロアへのアクセス制限（`ascendStairs`で崩壊済みフロアへの移動をブロック）
- [x] 崩壊警告のHUD表示（TopBar：残りターン表示、urgencyレベル4段階）
- [x] 崩壊に巻き込まれた場合のゲームオーバー処理（`turnManager.ts`で毎ターンチェック）
- [x] カジュアルモード（崩壊なし）のUI追加（CharacterSelectionScreen：チェックボックスで切り替え）

### Phase C: パーティシステム ✅ (2026-01-20)

仲間による戦略性と装備分配のジレンマを導入。

- [x] 仲間（Ally）の型定義（`combat/types.ts`に追加）
- [x] gameStoreにパーティ状態追加（allies Map、最大3人）
- [x] 仲間のAI行動モード（突撃/追従/待機）- `allyAI.ts`
- [x] 仲間の描画（AllyLayer）- `PixiViewport.tsx`
- [x] 仲間へのテクスチャ割り当て - `allyTextures.ts`
- [x] 仲間の死亡処理（永久ロスト、装備も消失）
- [x] 仲間のHPバー表示 - HealthBarLayerに統合
- [x] turnManager.tsに仲間アクションフェーズ追加（player → ally → enemy → effects）
- [x] 崩壊システムとの連携（階段から離れた仲間は取り残される）
- [x] 仲間への装備割り当てUI（EquipmentScreen内AllyCardコンポーネント）
- [x] 仲間の味方化メカニクス（cageタイル + recruit_ally効果）

### Phase D: 強化の巻物 + ユニーク装備 ✅ (2026-01-20)

Brogue希少性と厳選の深みを導入。

- [x] 強化の巻物のアイテム定義（`items/consumables.ts` - enchant type）
- [x] 強化の巻物使用UI（`EnchantTargetModal.tsx` - 武器/防具選択モーダル）
- [x] プレミアム枠追加ロジック（`gameStore.ts` - `enchantEquipment`アクション）
- [x] ユニーク装備の型定義（`combat/uniqueEquipment.ts` - `UniqueWeapon`, `UniqueArmor`）
- [x] ユニーク装備6種の定義
  - 武器4種: Hróðrvarðr's Blade, Rot Piercer, Void Fang, Forgotten King's Mace
  - 防具2種: Guardian's Plate, Void Shroud
- [x] ボス固定ドロップの実装（`gameStore.ts` - ボス撃破時にユニーク装備ドロップ）
- [x] ユニーク入手イベントの実装（weapon_shrineタイル、フロア4+、15%確率）

### Phase E: 創発的環境相互作用 ✅ (2026-01-20)

Brogue創発性。要素の相互作用を実装。

- [x] 地形相互作用システムの設計
- [x] 火→草を燃やす→煙発生
- [x] ガス+火→爆発
- [x] 水→火を消す
- [x] 沼→移動遅延
- [x] 武器属性と地形の連携（gameStore.ts L463-486, L556-579 - 火炎武器で草を燃やす等）
- [x] 連鎖反応の処理順序

### Phase F: メタ進行拡張 + シード共有 ✅ (2026-01-20)

リプレイ性と社会性を強化。

- [x] 遺産ポイント計算ロジック（metaProgressionStore.ts - calculateLegacyPoints）
- [x] 遺産ポイント表示UI（GameOverScreen.tsx - legacyPointsSection）
- [x] クラス解放条件と処理（isClassUnlocked: warrior=初期, hunter=F4到達, scholar=ボス1体）
- [ ] 初期装備選択肢の拡張（将来実装）
- [ ] 倉庫枠拡張（将来実装）
- [x] シード入力フィールドUI（CharacterSelectionScreen.tsx）
- [x] シード表示（TopBar.tsx - ダンジョン内で表示）
- [x] シードコピー機能（TopBar.tsx - handleCopySeed）

---

## 既存タスク（武器システム） ✅

- [x] 装備中の武器情報をHUDに表示する（Sidebar EQUIPMENTセクション）
- [x] 任意のタイミングで武器を付け替える機能（装備画面から）
- [x] 武器管理ルールをGAME_DESIGN.mdに明記する

---

## 実装済み

- [x] 設計書をGAME_DESIGN.mdに統合（2026-01-18）
  - 設計哲学（Brogue/片道勇者/ハクスラ三つの柱）
  - 崩壊システム設計
  - パーティシステム設計
  - プレミアム二層構造（青/緑）
  - ユニーク装備セクション
  - メタ進行拡張（遺産ポイント）
  - シード共有システム

---

## 残タスクサマリー

| Phase | 状態 | 残タスク |
|-------|------|----------|
| **A** | ✅ 完了 | - |
| **B** | ✅ 完了 | - |
| **C** | ✅ 完了 | - |
| **D** | ✅ 完了 | - |
| **E** | ✅ 完了 | - |
| **F** | ✅ 完了 | 初期装備拡張・倉庫枠拡張は将来実装 |

**全コアフェーズ完了** — Phase A〜F すべて実装済み
