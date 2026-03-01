# SEC-01: アクセシビリティ (a11y) エラー修正

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`pnpm nx lint web` で検出されたアクセシビリティ関連の **ERROR レベル** 30 件を修正する。
これらは CI の lint ステップをブロックするため、最優先で対応する。

### 参照ベストプラクティス
- **awesome-angular** Accessibility: PrimeNG a11y ガイド、Angular CDK a11y、WAI/WCAG 2.1 AA
- **nodebestpractices** 6.1: "Embrace linter security rules"

## 作業内容

### 1. `label-has-associated-control` (14 件)
`<label>` タグにフォームコントロールとの関連付けが欠けている。

**修正方法**:
- PrimeNG コンポーネント (`p-select`, `p-datepicker`) → `for` + `inputId` で関連付け
- 通常の `<input>` → `for` + `id` で関連付け
- コントロールグループ (`p-selectbutton`, チェックボックスグループ) → `<span>` + `id` + `aria-labelledby` に変更

```diff
-<label class="font-medium text-sm">ステータス</label>
-<p-select [options]="statusOptions" [(ngModel)]="selectedStatus" />
+<label for="status-filter" class="font-medium text-sm">ステータス</label>
+<p-select [options]="statusOptions" inputId="status-filter" [(ngModel)]="selectedStatus" />
```

### 2. `click-events-have-key-events` + `interactive-supports-focus` (16 件 = 8 ペア)
`(click)` のみを持つ `<div>` / `<a>` にキーボードイベントと `tabindex` が欠けている。

**修正方法**: `role="button"` + `tabindex="0"` + `(keydown.enter)` を追加

```diff
-<div (click)="toggle()">メニュー</div>
+<div role="button" tabindex="0" (click)="toggle()" (keydown.enter)="toggle()">メニュー</div>
```

### 3. `no-empty-function` (3 件)
空の error コールバックにコメントを追加。

```diff
-error: () => { },
+error: () => { /* Project list is optional, ignore errors */ },
```

### 4. `no-inferrable-types` (2 件)
`--fix` で自動修正可能。`pnpm nx lint web --fix` を実行。

## 対象ファイル

| パス | 変更内容 |
|------|----------|
| `apps/web/src/app/features/admin/audit-logs/audit-log-viewer.component.ts` | MODIFY: `for`/`inputId` 追加 (2 件) |
| `apps/web/src/app/features/admin/tenant/tenant-settings.component.ts` | MODIFY: `<label>` → `<span>` + `aria-labelledby` (2 件) |
| `apps/web/src/app/features/expenses/expense-form.component.ts` | MODIFY: `for`/`id` 追加 (1 件) |
| `apps/web/src/app/features/expenses/expense-summary.component.ts` | MODIFY: `for`/`inputId` 追加 (2 件) |
| `apps/web/src/app/features/projects/project-list.component.ts` | MODIFY: `for`/`id`/`inputId` 追加 (2 件) |
| `apps/web/src/app/features/timesheets/timesheet-report.component.ts` | MODIFY: `for`/`inputId` 追加 (2 件) |
| `apps/web/src/app/features/workflows/workflow-list.component.ts` | MODIFY: `for`/`inputId` 追加 (3 件) |
| `apps/web/src/app/shared/components/app-shell.component.ts` | MODIFY: `role`, `tabindex`, `keydown.enter` 追加 (3 箇所) |
| `apps/web/src/app/shared/notification-bell/notification-bell.component.ts` | MODIFY: `role`, `tabindex`, `keydown.enter` 追加 (2 箇所) |
| `apps/web/src/app/features/notifications/notification-list.component.ts` | MODIFY: `role`, `tabindex`, `keydown.enter` 追加 (1 箇所) |
| `apps/web/src/app/features/invoices/invoice-form.component.ts` | MODIFY: 空コールバックにコメント追加 |
| `apps/web/src/app/features/workflows/workflow-form.component.ts` | MODIFY: 空コールバックにコメント追加 |
| `apps/web/src/app/core/auth/auth.service.spec.ts` | MODIFY: 空コールバックにコメント追加 |
| `apps/web/src/app/core/services/logger.service.ts` | MODIFY: `--fix` で自動修正 |
| `apps/web/src/app/shared/components/breadcrumb.component.ts` | MODIFY: `--fix` で自動修正 |

## 完了条件
- [ ] `pnpm nx lint web` が **0 errors** で終了すること
- [ ] `pnpm nx build web` PASS
- [ ] `pnpm nx test web` PASS
