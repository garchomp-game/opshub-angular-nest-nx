# SEC-04: 型安全強化 (`any` → 適切な型付け) ウォークスルー

> 実施日: 2026-03-01

## 概要

`@typescript-eslint/no-explicit-any` 警告 **105件を0件に削減**。
OpenAPI SDK 生成済み DTO や共有型を活用し、フロントエンド全域の型安全性を向上させた。

---

## 検証結果

### `pnpm nx lint web`

| 指標 | Before | After |
|------|--------|-------|
| `no-explicit-any` 警告 | **105** | **0** |
| 総 warning 数 | 155 | 50 |
| エラー | 0 | 0 |

```
✖ 50 problems (0 errors, 50 warnings)
NX   Successfully ran target lint for project web
```

> 残り 50 warnings は全て `security/detect-object-injection` (本チケットのスコープ外)

### `pnpm nx build web`

```
Application bundle generation complete. [6.060 seconds]
Output location: /home/garchomp-game/workspace/starlight-test/opshub/dist/apps/web
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

✅ 全テストパス

---

## 変更ファイル一覧 (36ファイル)

### Workflows モジュール (5ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `workflow.service.ts` | `http.get<any>` → `ApiResponse<T>` / `CreateWorkflowDto` / `UpdateWorkflowDto` 導入 |
| `workflow-detail.component.ts` | メソッド引数 `any` → `Workflow` 型、ステータスラベル `as any` → `Record<string, string>` |
| `workflow-form.component.ts` | HTTP レスポンス型指定、ユーザーリスト取得の型付け |
| `workflow-list.component.ts` | `event: any` → `{ first?: number; rows?: number }` (PaginatorState) |
| `workflow.service.spec.ts` | `(URL as any)` → `as unknown as ...` パターン |

### Projects モジュール (7ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `project.service.ts` | `Project`, `ProjectMember`, `TaskStats` インターフェース追加、全 `any` 置換 |
| `task.service.ts` | `Task` インターフェース追加、`CreateTaskDto` / `UpdateTaskDto` 導入 |
| `document.service.ts` | `ProjectDocument` インターフェース追加 |
| `project-list.component.ts` | paginator イベント型付け |
| `project-form.component.ts` | HTTP レスポンス型指定 |
| `kanban-board.component.ts` | `getTasksByStatus` 戻り型 `any[]` → `Task[]` |
| `document-list.component.ts` | `ProjectDocument` パラメーター型付け |

### Invoices モジュール (4ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `invoices.service.ts` | `loadAll` / `loadOne` / `updateStatus` / `deleteInvoice` の HTTP 型指定 |
| `invoices.service.spec.ts` | discriminated union `success` チェック追加 |
| `invoice-list.component.ts` | `Record<string, string>` + paginator 型付け |
| `invoice-form.component.ts` | `AbstractControl` 型、日付フォーマッター型付け |
| `invoice-detail.component.ts` | `INVOICE_TRANSITIONS` → `Record<string, string[]>` |

### Dashboard モジュール (2ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `dashboard.service.ts` | `KpiData` / `DashboardData` / `DashboardNotification` 定義、全 Observable 型付け |
| `dashboard.component.ts` | `onNotificationClick` パラメーター → `DashboardNotification` |

### Admin モジュール (5ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `users.service.ts` | `AdminUser` インターフェース追加 |
| `tenant.service.ts` | `Tenant` インターフェース追加 |
| `audit-logs.service.ts` | `AuditLog` インターフェース追加、`PaginationMeta` 導入 |
| `audit-log-viewer.component.ts` | paginator イベント型付け |
| `user-list.component.ts` | `ROLE_LABELS as any` → `Record<string, string>` |

### Expenses モジュール (2ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `expense-form.component.ts` | `http.get<any>` → typed ユーザー/プロジェクトレスポンス |
| `expense-list.component.ts` | paginator イベント型付け |

### Notifications モジュール (3ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `notification.service.ts` | `params: any` → `Record<string, string>` + `String()` 変換 |
| `notification-list.component.ts` | paginator イベント型付け |
| `notification-list.component.spec.ts` | `Confirmation` 型インポート、`Notification` モデル使用 |

### Auth スペック (3ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `login.component.spec.ts` | `authServiceMock: any` → `Record<string, any>` + eslint-disable |
| `forgot-password.component.spec.ts` | 同上 + bracket-notation アクセス |
| `reset-password.component.spec.ts` | 同上 + bracket-notation アクセス |

### Timesheets スペック (1ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `timesheet.service.spec.ts` | `as any` → `as unknown as typeof URL.createObjectURL` |

### テナント設定スペック (1ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `tenant-settings.component.spec.ts` | `as any` → `ExportJobStatus` 型、signal 型パラメーター追加 |

### インフラ (1ファイル)

| ファイル | 変更内容 |
|---------|---------|
| `libs/api-client/src/index.ts` | `export` → `export type` (`isolatedModules` ビルドエラー修正) |

---

## 使用した型付けパターン

| パターン | 説明 | 使用箇所 |
|----------|------|----------|
| `ApiResponse<T>` | HTTP レスポンスの共通型 | 全サービスの GET/POST/PATCH/DELETE |
| `Record<string, string>` | ラベル・色マップのインデックスアクセス | ステータスラベル、パラメーター構築 |
| `{ first?: number; rows?: number }` | PrimeNG Paginator イベント | 全コンポーネントの `onPaginatorChange` |
| `as unknown as T` | テストモックの安全な型変換 | spec ファイル全般 |
| `eslint-disable-next-line` | vi.fn() モック互換性 | auth spec 3ファイルのみ |

---

## 注意事項

- Auth spec 3ファイルの `authServiceMock` は `Record<string, any>` + `eslint-disable-next-line` を使用。
  vi.fn() の `mockReturnValue` 等のメソッドと TypeScript の index-signature 制約の両立が困難なため。
- `libs/api-client/src/index.ts` の `isolatedModules` エラーは本チケット以前から存在していた issue を併せて修正。
