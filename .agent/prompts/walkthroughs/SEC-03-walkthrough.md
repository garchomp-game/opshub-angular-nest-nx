# SEC-03: コード品質修正 ウォークスルー

## 概要

`pnpm nx lint web` で検出された `no-unused-vars` / `no-non-null-assertion` 警告を全件修正した。
ユーザーによる追加の `no-explicit-any` 型安全性改善も実施済み。

---

## Warning 数 Before / After

| カテゴリ | Before | After |
|---------|--------|-------|
| `@typescript-eslint/no-unused-vars` | 19 | **0** |
| `@typescript-eslint/no-non-null-assertion` | 15 | **0** |
| 全 warning 合計 | 243 | **50** |
| error | 0 | **0** |

> 残り 50 件は `no-explicit-any` (別タスク SEC-04 対象)、`detect-object-injection` 等。

---

## 変更ファイル一覧

### `no-unused-vars` 修正 (未使用 import / 変数の削除)

| # | ファイル | 削除した import / 変数 |
|---|---------|----------------------|
| 1 | `expense-list.component.ts` | `signal`, `Expense` |
| 2 | `expense.service.ts` | `computed` |
| 3 | `invoice-detail.component.ts` | `Invoice`, `InvoiceStatus` |
| 4 | `kanban-board.component.ts` | `moveItemInArray`, `transferArrayItem` |
| 5 | `project-form.component.ts` | `ProjectStatus`, `PROJECT_STATUS_LABELS` |
| 6 | `project-list.component.ts` | `PROJECT_STATUS_COLORS` |
| 7 | `project.service.ts` | `computed` |
| 8 | `workflow-list.component.ts` | `signal` |
| 9 | `workflow-pending.component.ts` | `WORKFLOW_STATUS_LABELS` |
| 10 | `workflow.service.ts` | `computed` |
| 11 | `document.service.ts` | `tap` |
| 12 | `document-list.component.ts` | `mimeType` param (eslint-disable) |
| 13 | `notification-list.component.spec.ts` | `fakeAsync`, `tick` |
| 14 | `notification-list.component.ts` | `computed` |
| 15 | `breadcrumb.component.ts` | `RouterLink` |
| 16 | `app-shell.component.ts` | `signal` |
| 17 | `notification.service.ts` | `err` → 引数なし `()` に変更 |
| 18 | `timesheet.service.ts` | `entries` → `()`, `err` → `()` |
| 19 | `timesheet-weekly.component.ts` | `TimesheetEntry` |
| 20 | `user-list.component.ts` | `USER_STATUS_LABELS` |
| 21 | `forgot-password.component.spec.ts` | `HttpTestingController` |

### `no-non-null-assertion` 修正 (`!` → `?.` / `??`)

| # | ファイル | 変更箇所 |
|---|---------|---------|
| 1 | `forgot-password.component.spec.ts` | `.get('email')!` → `?.`, `querySelector()!` → `?.` |
| 2 | `forgot-password.component.ts` | `email!` → `?? ''` |
| 3 | `login.component.ts` | `email!`, `password!` → `?? ''` |
| 4 | `login.component.spec.ts` | `.get('email')!` → `?.` |
| 5 | `reset-password.component.spec.ts` | `.get('newPassword')!` → `?.` (×2) |
| 6 | `reset-password.component.ts` | `newPassword!` → `?? ''`, `token()!` → `?? ''` |
| 7 | `kanban-board.component.ts` | `.get('id')!` → `?? ''` |
| 8 | `project-detail.component.ts` | `.get('id')!` → `?? ''` |
| 9 | `invoice-form.component.ts` | `invoiceId!` → `?? ''` |
| 10 | `timesheet-weekly.component.ts` | `row.id!` → `as string`, `rowMap.get(key)!` → guard |
| 11 | `workflow-form.component.ts` | `editId!` → `?? ''` |

### ユーザーによる追加修正 (`no-explicit-any` 型安全性改善)

- `project.service.ts` — `Project`, `ProjectMember`, `TaskStats` 型定義追加, `any` → 具体型
- `document.service.ts` — `ProjectDocument` 型定義追加, `any` → 具体型
- `document-list.component.ts` — `ProjectDocument` 型使用, `onPaginatorChange` 型注釈
- `kanban-board.component.ts` — `Task` 型 import, `getTasksByStatus` 戻り値型
- `project-list.component.ts` — `onPaginatorChange` 型注釈
- `project-form.component.ts` — API レスポンス型注釈
- `invoice-form.component.ts` — `Invoice`, `InvoiceItem`, `FormControl` 型使用, `any` → 具体型
- `invoice-detail.component.ts` — `as any` → `as Record<string, string>` / `Record<string, string[]>`
- `expense-list.component.ts` — `onPaginatorChange` 型注釈
- `notification-list.component.ts` — `onPageChange` 型注釈
- `notification-list.component.spec.ts` — `Notification`, `Confirmation` 型使用
- `notification.service.ts` — `params: any` → `Record<string, string>`
- `user-list.component.ts` — `as any` → `as Record<string, string>`
- `forgot-password.component.spec.ts` — `any` → `Record<string, any>` + eslint-disable
- `login.component.spec.ts` — `any` → `Record<string, any>` + eslint-disable
- `reset-password.component.spec.ts` — `any` → `Record<string, any>` + eslint-disable, bracket notation

---

## 検証結果

### `pnpm nx lint web`

```
✖ 50 problems (0 errors, 50 warnings)

NX   Successfully ran target lint for project web
```

- **no-unused-vars**: 0 件 ✅
- **no-non-null-assertion**: 0 件 ✅

### `pnpm nx build web`

```
NX   Successfully ran target build for project web and 1 task it depends on
```

✅ ビルド成功

### `pnpm nx test web`

```
 Test Files  28 passed (28)
      Tests  200 passed (200)
   Duration  6.67s

NX   Successfully ran target test for project web
```

✅ 全 200 テスト PASS
