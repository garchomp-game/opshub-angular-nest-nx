# T7: 管理画面 + 検索 — NG-ZORRO 移行

## 対象ファイル
- `apps/web/src/app/features/admin/users/user-list.component.ts`
- `apps/web/src/app/features/admin/users/invite-modal.component.ts`
- `apps/web/src/app/features/admin/audit-logs/audit-log-viewer.component.ts`
- `apps/web/src/app/features/admin/tenant/tenant-settings.component.ts`
- `apps/web/src/app/features/search/search-results/search-results.component.ts`
- `apps/web/src/app/features/placeholder.component.ts`

## 使用する NG-ZORRO コンポーネント
- `NzTableModule` — ユーザー一覧、監査ログ
- `NzTagModule` — ロールバッジ (tenant_admin=red, pm=blue, member=green, etc.)
- `NzBadgeModule` — ステータス表示 (active=success, inactive=default)
- `NzModalModule` (NzModalRef) — 招待モーダル
- `NzFormModule` + `NzInputModule` + `NzSelectModule` — 招待フォーム、テナント設定
- `NzDatePickerModule` — 監査ログフィルタ
- `NzListModule` — 検索結果
- `NzHighlightModule` — 検索キーワードハイライト
- `NzResultModule` — プレースホルダー (Empty / Coming Soon)
- `NzPopconfirmModule` — ユーザー無効化確認
- `NzCardModule` — セクション
- `NzDividerModule` — 区切り

## デザイン要件
### user-list: nz-table + nz-tag (ロール) + nz-badge (ステータス)
### invite-modal: NzModalRef + nz-form（メール + ロール選択）
### audit-log-viewer: nz-table + nz-date-picker (範囲フィルタ)
### tenant-settings: nz-form セクション分け (基本情報 / セキュリティ)
### search-results: nz-list + タイプ別アイコン
### placeholder: nz-result status="info" title="Coming Soon"

## 共通ルール
1. `mat-*` → `nz-*`、2. Tailwind レイアウトのみ、3. ロジック不変、4. 日本語 UI
