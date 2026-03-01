# SEC-03: コード品質修正 (unused vars / non-null assertion)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`pnpm nx lint web` で検出されたコード品質系の **WARNING** レベル計 33 件を修正する。
SEC-01 のエラー修正後、warning 数削減によりコードの保守性を向上させる。

### 参照ベストプラクティス
- **nodebestpractices 3.x**: コードスタイル — ESLint でコーディング規約を強制

## 作業内容

### 1. `no-unused-vars` (19 件)
未使用の import / 変数を削除。

```diff
-import { signal, computed } from '@angular/core';
+import { signal } from '@angular/core';
```

対象例:
- `expense-list.component.ts`: `signal`, `Expense`
- `expense.service.ts`: `computed`
- `invoice-detail.component.ts`: `Invoice`, `InvoiceStatus`
- `kanban-board.component.ts`: `moveItemInArray`, `transferArrayItem`
- `project-form.component.ts`: `ProjectStatus`, `PROJECT_STATUS_LABELS`
- `project-list.component.ts`: `PROJECT_STATUS_COLORS`
- `project.service.ts`: `computed`
- `workflow-list.component.ts`: `signal`
- `workflow-pending.component.ts`: `WORKFLOW_STATUS_LABELS`
- `workflow.service.ts`: `computed`
- `document.service.ts`: `tap`
- `notification-list.component.ts`: `fakeAsync`, `tick`, `computed`
- `breadcrumb.component.ts`: `RouterLink`
- `app-shell.component.ts`: `signal`
- `user-list.component.ts`: `USER_STATUS_LABELS`
- `notification.service.ts`: `err`
- `timesheet.service.ts`: `entries`, `err`
- `document-list.component.ts`: `mimeType`
- `forgot-password.component.spec.ts`: `HttpTestingController`

### 2. `no-non-null-assertion` (14 件)
`!` 演算子を Optional chaining (`?.`) またはガード節に置換。

```diff
-const email = user.email!;
+const email = user.email ?? '';
```

## 対象ファイル

| パス | 変更内容 |
|------|----------|
| 上記対象ファイル多数 | MODIFY: 未使用 import 削除、`!` → `?.` / `??` 置換 |

## 検証手順
1. `pnpm nx lint web --fix` を先に実行（一部自動修正可能）
2. 残りを手動修正
3. `pnpm nx lint web` で warning 数が 33 件減少していることを確認

## ウォークスルー出力
作業完了後、以下のパスにウォークスルーを出力すること:
`opshub/.agent/prompts/walkthroughs/SEC-03-walkthrough.md`

## 完了条件
- [ ] `no-unused-vars` 警告が 0 件
- [ ] `no-non-null-assertion` 警告が 0 件
- [ ] `pnpm nx build web` PASS
- [ ] `pnpm nx test web` PASS
