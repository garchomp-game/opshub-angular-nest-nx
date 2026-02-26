# T4: プロジェクト管理 — NG-ZORRO 移行

## 対象ファイル
- `apps/web/src/app/features/projects/project-list.component.ts`
- `apps/web/src/app/features/projects/project-detail.component.ts`
- `apps/web/src/app/features/projects/project-form.component.ts`
- `apps/web/src/app/features/projects/kanban-board.component.ts`
- `apps/web/src/app/features/projects/documents/document-list.component.ts`

## 使用する NG-ZORRO コンポーネント
- `NzTableModule` — 一覧、ドキュメント一覧
- `NzCardModule` — カード表示、カンバンカード
- `NzProgressModule` — プロジェクト進捗バー
- `NzTabsModule` (nz-tabset) — 詳細ページのタブ (概要/タスク/メンバー/ドキュメント)
- `NzDescriptionsModule` — プロジェクト詳細
- `NzFormModule` + `NzInputModule` + `NzSelectModule` + `NzDatePickerModule` — フォーム
- `NzTagModule` — ステータス
- `NzUploadModule` — ドキュメントアップロード
- `NzAvatarModule` — メンバーアバター
- `DragDropModule` (CDK) — カンバン DnD（そのまま維持）

## デザイン要件
### project-list: nz-table or nz-list カード + nz-progress
### project-detail: nz-tabset (4 タブ) + nz-descriptions
### project-form: nz-form カード
### kanban-board: nz-card + CDK DragDrop（DnD ロジックはそのまま）
### document-list: nz-table + nz-upload

## 共通ルール
1. `mat-*` → `nz-*`、2. Tailwind レイアウトのみ、3. ロジック不変、4. 日本語 UI
