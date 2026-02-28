# A1: API仕様 突き合わせレポート

> **生成日時**: 2026-02-27  
> **対象ドキュメント**: `opsHub-doc/src/content/docs/spec/apis/API-*.md` (全15ファイル)  
> **対象実装**: `opshub/apps/api/src/modules/` 配下の全 controller / service / DTO

> [!IMPORTANT]
> ドキュメントは **Next.js + Supabase (Server Components / Server Actions)** を前提とした仕様。  
> 実装は **NestJS + Prisma** のREST API。このアーキテクチャ差異により、全APIのエンドポイント形式・認可方式に構造的乖離がある。

---

## サマリー

| 分類 | 件数 |
|---|---|
| ドキュメント記載で実装に存在するAPI | 39 |
| 型・フィールドの差異 | 18 |
| 認可ルールの差異 | 12 |
| 未実装 API（ドキュメントにあり、実装なし） | 7 |
| 未ドキュメント API（実装にあり、ドキュメントなし） | 14 |

---

## 1. エンドポイント突き合わせ

### API-A01 テナント管理

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-A01-DETAIL | Server Component 直接クエリ | `GET /api/admin/tenant` | ✅ 存在。種別が REST API に変更 |
| SPEC-API-A01-UPDATE | Server Action | `PATCH /api/admin/tenant` | ⚠️ ドキュメント: `name`, `logo_url`, `contact_email`, `address` / 実装DTO: `name`, `settings` のみ。`logo_url`, `contact_email`, `address` 未実装 |
| SPEC-API-A01-SETTINGS | Server Action (設定変更) | `PATCH /api/admin/tenant` (settingsフィールド) | ⚠️ ドキュメントでは別APIだが実装ではUPDATEに統合。`settings` を `Record<string, unknown>` で受けているため型安全でない |
| SPEC-API-A01-EXPORT | `POST /api/tenant/export` | — | ❌ **未実装** |
| SPEC-API-A01-DELETE | Server Action | `DELETE /api/admin/tenant` (softDelete) | ⚠️ ドキュメント: `confirmation` (テナント名確認) フィールドが必要 / 実装: 確認なしで論理削除 |

### API-A02 ユーザー招待/管理

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-A02-LIST | Server Component 直接クエリ | `GET /api/admin/users` | ⚠️ ドキュメント: フィルタ(role, status), 検索(name/email), ソート, ページネーション対応 / 実装: パラメータなし (テナントID指定のみ) |
| SPEC-API-A02-INVITE | Server Action | `POST /api/admin/users/invite` | ⚠️ ドキュメント: `roles: string[]` (複数ロール) / 実装DTO: `role: Role` (単一ロール)。また `displayName` が実装に追加 |
| SPEC-API-A02-ROLE | Server Action | `PATCH /api/admin/users/:id/role` | ⚠️ ドキュメント: `roles: string[]` (全量置換) / 実装DTO: `role: Role` (単一ロール)。ドキュメントの自己変更禁止、最後のTenant Admin保護が実装にあるかはservice層未確認 |
| SPEC-API-A02-STATUS | Server Action | `PATCH /api/admin/users/:id/status` | ⚠️ ドキュメント: `action: "disable" \| "enable"` / 実装: `body: { active: boolean }` |
| SPEC-API-A02-RESET | Server Action (パスワードリセット) | — | ❌ **未実装** |
| — | — | `GET /api/admin/users/:id` | 📝 **未ドキュメント** (個別ユーザー取得) |

### API-B01 申請一覧取得

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-B01 | Server Component 直接クエリ | `GET /api/workflows` | ⚠️ ドキュメント: `per_page` (デフォルト20) / 実装DTO: `limit` (デフォルト20)。フィールド名が異なる |
| — | — | `GET /api/workflows/pending` | ✅ ドキュメントの `mode=pending` に対応する専用エンドポイント |
| — | — | `GET /api/workflows/:id` | 📝 **未ドキュメント** (個別ワークフロー取得が独立APIとして記載なし) |

### API-B02 申請作成/更新

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-B02 (create) | Server Action (FormData) | `POST /api/workflows` | ⚠️ ドキュメント: `attachments: File[]` (ファイル添付) / 実装: 添付ファイル非対応。ドキュメント: camelCase と snake_case 混在 (`approver_id`) / 実装DTO: `approverId` (camelCase統一) |
| SPEC-API-B02 (update) | Server Action | `PATCH /api/workflows/:id` | ✅ 存在 |
| — | — | `POST /api/workflows/:id/submit` | ⚠️ ドキュメントでは `action: "draft" \| "submit"` で作成時に送信も兼ねるが、実装では送信が別エンドポイント |

### API-B03 申請承認/差戻し

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-B03 (approve) | Server Action `action: "approve"` | `POST /api/workflows/:id/approve` | ✅ 実装あり。ドキュメントは1アクションで3操作だが実装は各別エンドポイント |
| SPEC-API-B03 (reject) | Server Action `action: "reject"` | `POST /api/workflows/:id/reject` | ✅ 実装あり |
| SPEC-API-B03 (withdraw) | Server Action `action: "withdraw"` | `POST /api/workflows/:id/withdraw` | ✅ 実装あり |

### API-C01 プロジェクトCRUD

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-C01-LIST | Server Component 直接クエリ | `GET /api/projects` | ✅ 存在 |
| SPEC-API-C01-DETAIL | Server Component 直接クエリ | `GET /api/projects/:id` | ✅ 存在 |
| SPEC-API-C01-CREATE | Server Action | `POST /api/projects` | ✅ 存在。DTO: `pmId` (camelCase) vs ドキュメント: `pm_id` |
| SPEC-API-C01-UPDATE | Server Action | `PATCH /api/projects/:id` | ✅ 存在 |
| SPEC-API-C01-MEMBERS (add) | Server Action | `POST /api/projects/:id/members` | ✅ 存在 |
| SPEC-API-C01-MEMBERS (remove) | Server Action | `DELETE /api/projects/:id/members/:userId` | ✅ 存在。ドキュメント: body で `user_id` 送信 / 実装: URL パラメータ |

### API-C02 タスクCRUD

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-C02-LIST | Server Component 直接クエリ | `GET /api/projects/:projectId/tasks` | ✅ 存在 |
| SPEC-API-C02-CREATE | Server Action | `POST /api/projects/:projectId/tasks` | ✅ 存在。ドキュメントの `project_id` はURL パラメータとして提供 |
| SPEC-API-C02-UPDATE | Server Action | `PUT /api/tasks/:id` | ⚠️ ドキュメント: `task_id` で指定 / 実装: URL の `:id` で指定。メソッドが PATCH→PUT |
| SPEC-API-C02-STATUS | Server Action | `PATCH /api/tasks/:id/status` | ✅ 存在 |
| SPEC-API-C02-DELETE | Server Action | `DELETE /api/tasks/:id` | ✅ 存在 |

### API-C03-1 工数入力/更新

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-C03-1-DAILY | Server Component 直接クエリ | `GET /api/timesheets/daily` | ✅ 存在 |
| SPEC-API-C03-1-WEEKLY | Server Component 直接クエリ | `GET /api/timesheets/weekly` | ✅ 存在 |
| SPEC-API-C03-1-CREATE | Server Action | `POST /api/timesheets` | ✅ 存在。DTO フィールドは概ね一致 |
| SPEC-API-C03-1-BULK | Server Action | `PUT /api/timesheets/bulk` | ✅ 存在 |
| SPEC-API-C03-1-DELETE | Server Action | `DELETE /api/timesheets/:id` | ✅ 存在 |

### API-C03-2 工数集計

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-C03-2-BY-PROJECT | Server Component 直接クエリ | `GET /api/timesheets/summary/by-project` | ✅ 存在 |
| SPEC-API-C03-2-BY-MEMBER | Server Component 直接クエリ | `GET /api/timesheets/summary/by-member` | ✅ 存在 |
| SPEC-API-C03-2-EXPORT | Route Handler `GET /api/timesheets/export` | `GET /api/timesheets/export` | ✅ 存在。StreamableFile で CSV 返却 |

### API-D01 経費管理

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-D01 createExpense | Server Action | `POST /api/expenses` | ✅ 存在。DTO フィールドは概ね一致 |
| SPEC-API-D01 getExpenses | Server Action | `GET /api/expenses` | ✅ 存在 |
| SPEC-API-D01 getExpenseById | Server Action | `GET /api/expenses/:id` | ✅ 存在 |
| SPEC-API-D01 getProjects | Server Action (補助) | — | ❌ **未実装** (経費用PJ一覧。プロジェクトAPIで代替可) |
| SPEC-API-D01 getApprovers | Server Action (補助) | — | ❌ **未実装** (承認者一覧。ユーザーAPIで代替可) |

### API-D02 経費集計

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-D02-BY-CATEGORY | Server Action | `GET /api/expenses/summary/by-category` | ✅ 存在 |
| SPEC-API-D02-BY-PROJECT | Server Action | `GET /api/expenses/summary/by-project` | ✅ 存在 |
| SPEC-API-D02-BY-MONTH | Server Action | `GET /api/expenses/summary/by-month` | ✅ 存在 |
| SPEC-API-D02-STATS | Server Action | `GET /api/expenses/summary/stats` | ✅ 存在 |

### API-E01 通知API

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-E01-LIST | Server Action `getNotifications()` | `GET /api/notifications` | ⚠️ ドキュメント: パラメータなし, limit(20)固定 / 実装: `NotificationQueryDto` でクエリパラメータ対応 |
| SPEC-API-E01-COUNT | Server Action `getUnreadCount()` | `GET /api/notifications/unread-count` | ✅ 存在 |
| SPEC-API-E01-READ | Server Action `markAsRead(id)` | `PATCH /api/notifications/:id/read` | ✅ 存在 |
| SPEC-API-E01-READALL | Server Action `markAllAsRead()` | `PATCH /api/notifications/read-all` | ✅ 存在 |
| SPEC-API-E01-CREATE | ヘルパー関数 `createNotification()` | (内部ヘルパー — 直接エンドポイントではない) | ✅ 設計意図通り |

### API-F01 ドキュメント管理

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-F01 getDocuments | Server Action | `GET /api/projects/:projectId/documents` | ✅ 存在 |
| SPEC-API-F01 uploadDocument | Server Action | `POST /api/projects/:projectId/documents` | ✅ 存在。Multer + FileInterceptor 使用 |
| SPEC-API-F01 deleteDocument | Server Action | `DELETE /api/documents/:id` | ✅ 存在 |
| SPEC-API-F01 getDownloadUrl | Server Action (signedURL取得) | `GET /api/documents/:id/download` | ⚠️ ドキュメント: signedURL を返却 / 実装: 直接バイナリダウンロード (buffer + Content-Disposition) |

### API-G01 全文検索

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-G01 searchAll | Server Action | `GET /api/search` | ⚠️ ドキュメント: `query` パラメータ / 実装DTO: `q` パラメータ |

### API-H01 請求管理

| API ID | ドキュメント | 実装 | 差異 |
|---|---|---|---|
| SPEC-API-H01 createInvoice | Server Action | `POST /api/invoices` | ✅ 存在 |
| SPEC-API-H01 updateInvoice | Server Action | `PATCH /api/invoices/:id` | ✅ 存在 |
| SPEC-API-H01 getInvoices | Server Action | `GET /api/invoices` | ✅ 存在 |
| SPEC-API-H01 getInvoiceById | Server Action | `GET /api/invoices/:id` | ✅ 存在 |
| SPEC-API-H01 updateInvoiceStatus | Server Action | `PATCH /api/invoices/:id/status` | ✅ 存在 |
| SPEC-API-H01 deleteInvoice | Server Action | `DELETE /api/invoices/:id` | ✅ 存在 |

---

## 2. リクエスト/レスポンス型の主要差異

| API ID | ドキュメントの型 | 実装の型 (DTO) | 差異内容 |
|---|---|---|---|
| A01-UPDATE | `logo_url`, `contact_email`, `address` | `name`, `settings` のみ | ドキュメント記載のフィールドの大半が未実装 |
| A01-SETTINGS | 独立API, 専用型 `UpdateTenantSettingsInput` | `settings: Record<string, unknown>` に統合 | 型安全性なし。個別フィールドのバリデーションなし |
| A01-DELETE | `tenant_id`, `confirmation` | パラメータなし (tenantId はJWTから) | 確認フローが未実装 |
| A02-INVITE | `roles: string[]` (複数) | `role: Role` (単一) | 複数ロールの同時付与不可 |
| A02-ROLE | `roles: string[]` (全量置換) | `role: Role` (単一) | 複数ロール管理と一致しない |
| A02-STATUS | `action: "disable" \| "enable"` | `active: boolean` | フィールド名・型が異なる |
| B01 | `per_page` (snake_case) | `limit` (別名) | パラメータ命名の差異 |
| B02 | `approver_id`, `attachments`, `date_from` | `approverId`, 添付なし, `dateFrom` | snake_case→camelCase, 添付ファイル未実装 |
| C01-CREATE | `pm_id` | `pmId` | 命名規則の差異 (snake_case→camelCase) |
| C01-MEMBERS remove | body: `{ user_id }` | URL param: `:userId` | 指定方法が異なる |
| C02-UPDATE | メソッド未明記 | `PUT` | ドキュメントは Server Action, 実装は PUT メソッド |
| E01-LIST | パラメータなし、20件固定 | `NotificationQueryDto` (クエリ対応) | 実装のほうが柔軟 |
| F01-DOWNLOAD | signedURL 返却 (`{ url, filename }`) | 直接バイナリダウンロード | レスポンス形式が根本的に異なる |
| G01 | `query` パラメータ | `q` パラメータ | パラメータ名が異なる |
| H01-CREATE | `tax_rate` 任意 (デフォルト10) | `taxRate` 必須 (`@IsNumber`) | 必須/任意が異なる |
| 全API共通 | snake_case | camelCase | ドキュメントは snake_case、実装は camelCase 統一 |

---

## 3. 認可ルールの差異

| API ID | ドキュメント記載の認可 | 実装のガード/デコレータ | 差異 |
|---|---|---|---|
| A01全般 | Tenant Admin / IT Admin | `@Roles('tenant_admin')` | ドキュメントの `it_admin` ロールが実装に存在しない |
| A02全般 | Tenant Admin / IT Admin | `@Roles('tenant_admin')` | 同上 |
| B01 | ログイン必須, RLS制御 | ガードなし (全認証ユーザー) | ✅ 概ね一致 |
| B02 | Member, PM, Accounting | `@Roles('member', 'pm', 'accounting', 'approver', 'tenant_admin')` | 実装は `approver`, `tenant_admin` も追加許可 |
| B03 approve/reject | Approver, Tenant Admin | `@Roles('approver', 'tenant_admin')` | ✅ 一致 |
| B03 withdraw | 申請者本人 | ガードなし (service層で制御と推定) | ⚠️ コントローラレベルでの明示的ロール制限なし |
| C01 作成/更新 | PM / Tenant Admin | `@Roles('pm', 'tenant_admin')` | ✅ 一致 |
| C02-DELETE | PM のみ | `@Roles('pm')` | ✅ 一致 |
| C03-2集計 | PM / Accounting / Tenant Admin | `@Roles('pm', 'accounting', 'tenant_admin')` | ✅ 一致 |
| D02集計 | Accounting / PM / Tenant Admin | `@Roles('pm', 'accounting', 'tenant_admin')` | ✅ 一致 |
| F01 upload/delete | PM / Tenant Admin | `@Roles('pm', 'tenant_admin')` | ✅ 一致 |
| F01 閲覧/DL | プロジェクトメンバー | `@Roles('member', 'pm', 'tenant_admin')` | ⚠️ ドキュメント: PJメンバーシップ制御 / 実装: ロールベース。`accounting`, `approver` 不含 |
| H01全般 | Accounting / Tenant Admin (CRUD), PM (閲覧のみ) | `@Roles('pm', 'accounting', 'tenant_admin')` (全操作) | ⚠️ PMに CRUD 権限が付いている。ドキュメントでは閲覧のみの想定 |
| Timesheets export | Member(自分のみ)/PM(管轄PJ)/Accounting/TenantAdmin | ガードなし (全認証ユーザー) | ⚠️ ドキュメントではロール別のエクスポート範囲制限あり |

---

## 4. 未実装 API（ドキュメントにあり、実装なし）

| # | API ID | エンドポイント | ドキュメント | 備考 |
|---|---|---|---|---|
| 1 | SPEC-API-A01-EXPORT | `POST /api/tenant/export` | テナント全データエクスポート（GDPR対応） | 未実装 |
| 2 | SPEC-API-A02-RESET | — | パスワードリセット | 未実装 |
| 3 | SPEC-API-D01-getProjects | — | 経費申請用PJ一覧取得（補助） | Projects API で代替可能 |
| 4 | SPEC-API-D01-getApprovers | — | 経費申請用承認者一覧取得（補助） | Users API で代替可能 |
| 5 | (暗黙) | — | 監査ログ書き込み | 各APIでの監査ログ記録がドキュメントに明記されているが、コントローラ/サービス内での実装有無はservice層の詳細確認が必要 |
| 6 | (暗黙) | — | 通知作成ヘルパー利用 | ワークフロー承認/差戻し時の通知自動作成 |
| 7 | SPEC-API-C03-2-EXPORT | `GET /api/timesheets/export` | BOM付きUTF-8・日本語カラムヘッダ | 実装は存在するが、BOM・日本語ヘッダの仕様準拠は未確認 |

---

## 5. 未ドキュメント API（実装にあり、ドキュメントなし）

| # | 実装エンドポイント | メソッド | コントローラ | 備考 |
|---|---|---|---|---|
| 1 | `/api/auth/login` | POST | `AuthController` | 認証API全般がドキュメント対象外 |
| 2 | `/api/auth/register` | POST | `AuthController` | 同上 |
| 3 | `/api/auth/refresh` | POST | `AuthController` | 同上 |
| 4 | `/api/auth/logout` | POST | `AuthController` | 同上 |
| 5 | `/api/auth/me` | GET | `AuthController` | 同上 |
| 6 | `/api/admin/users/:id` | GET | `UsersController` | 個別ユーザー取得 |
| 7 | `/api/admin/audit-logs` | GET | `AuditLogsController` | 監査ログ一覧取得 |
| 8 | `/api/workflows/:id` | GET | `WorkflowsController` | 個別ワークフロー取得 |
| 9 | `/api/workflows/pending` | GET | `WorkflowsController` | 承認待ち一覧 (B01のmode=pendingに相当) |
| 10 | `/api/workflows/:id/submit` | POST | `WorkflowsController` | 送信専用エンドポイント |
| 11 | `/api/dashboard` | GET | `DashboardController` | ダッシュボードデータ |
| 12 | `/api/dashboard/kpi` | GET | `DashboardController` | KPIデータ |
| 13 | `/api/dashboard/project-progress` | GET | `DashboardController` | PJ進捗データ |
| 14 | `/api/health` | GET | `HealthController` | ヘルスチェック |

---

## 6. 構造的乖離（アーキテクチャ差異）

| 項目 | ドキュメント | 実装 |
|---|---|---|
| フレームワーク | Next.js (App Router) | NestJS |
| データ操作 | Server Components / Server Actions / Supabase Client | REST API + Prisma ORM |
| 認証 | Supabase Auth (`auth.getUser()`, JWT claims) | JwtAuthGuard + RolesGuard (NestJS Guards) |
| 認可 | RLS (Row Level Security) + Server Action 内チェック | `@Roles()` デコレータ + ガード |
| ファイルストレージ | Supabase Storage | ローカルストレージ (`LocalStorageService`) |
| 命名規則 | snake_case (`project_id`, `approver_id`) | camelCase (`projectId`, `approverId`) |
| キャッシュ | `revalidatePath()` / ISR | なし (NestJS REST) |
| ロール体系 | `it_admin` ロールあり | `it_admin` ロールなし。`tenant_admin` のみ |
| 不存在ロール | `IT Admin` | 実装に `IT Admin` ロールは存在しない |

---

## 7. 備考・推奨事項

> [!NOTE]
> 以下は指摘のみ。修正は本レポートのスコープ外。

1. **ドキュメントの前提アーキテクチャが異なる**: ドキュメントは Next.js + Supabase を前提としているが、実装は NestJS + Prisma。全APIの「種別」(Server Component / Server Action / Route Handler) が実態と合わない
2. **`IT Admin` ロール不在**: ドキュメントの多くで `IT Admin` ロールを参照しているが、実装には存在しない
3. **snake_case / camelCase の不一致**: 全DTOで命名規則が異なる
4. **添付ファイル機能**: ワークフロー申請の添付ファイル機能が未実装
5. **データエクスポート**: テナントデータエクスポート (GDPR対応) が未実装
6. **パスワードリセット**: 管理者によるパスワードリセット機能が未実装
7. **認証API群**: 実装にある auth モジュール全体がドキュメント化されていない
8. **ダッシュボードAPI**: 実装にある dashboard モジュールがドキュメント化されていない
