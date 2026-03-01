# SEC-04: 型安全強化 (`any` → 適切な型付け)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`no-explicit-any` 警告 105 件を段階的に解消する。
OpenAPI SDK (NA-03) で生成済みの型を活用し、フロントエンドの型安全性を向上させる。

### 参照ベストプラクティス
- **nodebestpractices 6.10**: "Validate incoming JSON schemas" — 型を明示することで入力検証と同等の効果
- **awesome-angular** TypeScript strict mode

## 現在の状況
`libs/api-client/` に OpenAPI 仕様から自動生成された DTO 型が存在する（NA-03 で導入済み）。
多くの `any` は API レスポンスの型指定が未実施のもの。

## 作業内容

### モジュール別対応方針

| モジュール | 件数 | 対策 |
|-----------|------|------|
| `workflows/` | 34 | `WorkflowDto`, `WorkflowStatusDto` 等を import |
| `projects/` | 23 | `ProjectDto`, `TaskDto` 等を import |
| `invoices/` | 21 | `InvoiceDto`, `InvoiceLineItemDto` 等を import |
| `dashboard/` | 10 | 集約用の独自型 `DashboardSummary` を定義 |
| `admin/` | 8 | `UserDto`, `TenantDto` 等を import |
| `expenses/` | 6 | `ExpenseDto` を import |
| テスト (.spec.ts) | 3 | `as unknown as XxxDto` パターン |

### 修正パターン

```diff
// サービスの戻り値型
-getWorkflows(): Observable<any> {
+getWorkflows(): Observable<PaginatedResponse<WorkflowDto>> {

// コンポーネントの event handler
-onPaginatorChange(event: any) {
+onPaginatorChange(event: { first: number; rows: number }) {

// API レスポンスの型指定
-this.http.get<any>('/api/projects').subscribe(...)
+this.http.get<ApiResponse<ProjectDto[]>>('/api/projects').subscribe(...)
```

### 共通レスポンス型の定義

```typescript
// libs/shared/src/lib/types/api-response.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; };
}
```

## 対象ファイル

| パス | 変更内容 |
|------|----------|
| `apps/web/src/app/features/workflows/*.ts` | MODIFY: 34 件の `any` → 型付け |
| `apps/web/src/app/features/projects/*.ts` | MODIFY: 23 件の `any` → 型付け |
| `apps/web/src/app/features/invoices/*.ts` | MODIFY: 21 件の `any` → 型付け |
| `apps/web/src/app/features/dashboard/*.ts` | MODIFY: 10 件の `any` → 型付け |
| `apps/web/src/app/features/admin/services/*.ts` | MODIFY: 8 件の `any` → 型付け |
| `apps/web/src/app/features/expenses/*.ts` | MODIFY: 6 件の `any` → 型付け |
| `libs/shared/src/lib/types/api-response.ts` | NEW: 共通レスポンス型定義 |

## 検証手順
1. モジュールごとに修正し、都度 `pnpm nx build web` で型チェック
2. 全モジュール修正後 `pnpm nx lint web` で `no-explicit-any` が 0 件
3. `pnpm nx test web` PASS

## ウォークスルー出力
作業完了後、以下のパスにウォークスルーを出力すること:
`opshub/.agent/prompts/walkthroughs/SEC-04-walkthrough.md`

## 完了条件
- [ ] `no-explicit-any` 警告が 0 件
- [ ] `pnpm nx build web` PASS
- [ ] `pnpm nx test web` PASS

## 注意事項
> [!IMPORTANT]
> このチケットは作業量が大きい (105 件)。モジュールごとに分割して段階的に進めること推奨。
> `detect-object-injection` (44 件) は大半が false positive のため、本チケットでは対応しない。
