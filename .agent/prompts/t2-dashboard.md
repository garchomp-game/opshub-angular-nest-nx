# T2: ダッシュボード — NG-ZORRO 移行

## 対象ファイル
- `apps/web/src/app/features/dashboard/dashboard.component.ts`
- `apps/web/src/app/features/dashboard/kpi-card.component.ts`

## 使用する NG-ZORRO コンポーネント
- `NzGridModule` (nz-row, nz-col) — グリッドレイアウト
- `NzCardModule` — KPI カード、セクションカード
- `NzStatisticModule` (nz-statistic) — 数値表示（件数、金額）
- `NzTableModule` — 最近のワークフロー一覧
- `NzTagModule` — ステータスバッジ
- `NzIconModule` — アイコン
- `NzSpinModule` — ローディング

## デザイン要件
### dashboard.component.ts
- ページタイトル: 「ダッシュボード」
- KPI カードを `nz-row` + `nz-col` で 4 列グリッド (`[nzSpan]="6"`)
- 下部: 最近のワークフロー一覧を `nz-table` で表示

### kpi-card.component.ts
- `nz-card` 内に `nz-statistic` を使用
- `[nzPrefix]` でアイコン表示
- `[nzValueStyle]` で数値のスタイル制御

## 共通ルール
1. `mat-*` import を全て `nz-*` に置換
2. Tailwind はレイアウト補助のみ
3. 既存ロジック変更禁止
4. 日本語 UI 維持
