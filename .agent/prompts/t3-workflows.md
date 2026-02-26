# T3: ワークフロー (申請管理) — NG-ZORRO 移行

## 対象ファイル
- `apps/web/src/app/features/workflows/workflow-list.component.ts`
- `apps/web/src/app/features/workflows/workflow-detail.component.ts`
- `apps/web/src/app/features/workflows/workflow-form.component.ts`
- `apps/web/src/app/features/workflows/workflow-pending.component.ts`

## 使用する NG-ZORRO コンポーネント
- `NzTableModule` — 一覧テーブル（ソート/ページネーション内蔵）
- `NzTagModule` — ステータスバッジ (draft=default, submitted=processing, approved=success, rejected=error)
- `NzDescriptionsModule` — 詳細情報表示
- `NzStepsModule` — 承認フロータイムライン
- `NzFormModule` + `NzInputModule` + `NzSelectModule` + `NzDatePickerModule` — フォーム
- `NzButtonModule` — アクションボタン
- `NzPopconfirmModule` — 承認/却下確認
- `NzCardModule` — セクション区切り
- `NzIconModule` — アイコン
- `NzSpinModule` — ローディング

## デザイン要件
### workflow-list: フィルタバー + テーブル + ステータスタグ
### workflow-detail: 2 カラム (左: nz-descriptions, 右: nz-steps タイムライン)
### workflow-form: nz-form カード内フォーム
### workflow-pending: nz-table + nz-popconfirm 承認ボタン

## 共通ルール
1. `mat-*` → `nz-*` 置換、2. Tailwind レイアウト補助のみ、3. ロジック変更禁止、4. 日本語 UI
