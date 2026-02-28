# A4: DB スキーマ + RLS + 認可 突き合わせレポート

**監査日**: 2026-02-27  
**対象ドキュメント**: `opsHub-doc/src/content/docs/detail/db/`, `detail/rls/`, `spec/authz/`, `requirements/roles/`  
**対象実装**: `opshub/libs/prisma-db/`, `opshub/apps/api/src/`

---

## 1. テーブル/モデル存在チェック

ドキュメント記載の 15 テーブルと Prisma スキーマのモデルを突き合わせた結果。

| # | ドキュメント (テーブル名) | Prisma モデル | DB テーブル名 (`@@map`) | 結果 |
|---|---|---|---|---|
| DD-DB-001 | `tenants` | `Tenant` | `tenants` | ✅ 一致 |
| DD-DB-002 | `user_roles` | `UserRole` | `user_roles` | ✅ 一致 |
| DD-DB-003 | `projects` | `Project` | `projects` | ✅ 一致 |
| DD-DB-004 | `project_members` | `ProjectMember` | `project_members` | ✅ 一致 |
| DD-DB-005 | `tasks` | `Task` | `tasks` | ✅ 一致 |
| DD-DB-006 | `workflows` | `Workflow` | `workflows` | ✅ 一致 |
| DD-DB-007 | `timesheets` | `Timesheet` | `timesheets` | ✅ 一致 |
| DD-DB-008 | `expenses` | `Expense` | `expenses` | ✅ 一致 |
| DD-DB-009 | `audit_logs` | `AuditLog` | `audit_logs` | ✅ 一致 |
| DD-DB-010 | `notifications` | `Notification` | `notifications` | ✅ 一致 |
| DD-DB-011 | `workflow_attachments` | `WorkflowAttachment` | `workflow_attachments` | ✅ 一致 |
| DD-DB-012 | `profiles` | `Profile` | `profiles` | ✅ 一致 |
| DD-DB-013 | `invoices` | `Invoice` | `invoices` | ✅ 一致 |
| DD-DB-014 | `invoice_items` | `InvoiceItem` | `invoice_items` | ✅ 一致 |
| DD-DB-015 | `documents` | `Document` | `documents` | ✅ 一致 |

### 追加モデル（ドキュメント未記載）

| Prisma モデル | 備考 |
|---|---|
| `User` (`@@map("users")`) | ドキュメントでは `auth.users`（Supabase 管理）を前提。実装ではカスタム `users` テーブルに変更されている |

> [!IMPORTANT]
> ドキュメントは Supabase `auth.users` を前提としているが、実装ではカスタム `User` モデル（`users` テーブル）に移行している。
> これに伴い `FK→auth.users(id)` は全て `FK→users(id)` に変わっている。アーキテクチャ上の重要な変更点。

---

## 2. カラム/フィールド詳細チェック

### 2.1 tenants

| ドキュメント カラム | 型 (Doc) | Prisma フィールド | 型 (Prisma) | 結果 |
|---|---|---|---|---|
| `id` | `uuid` PK | `id` | `String @id @default(uuid())` | ✅ |
| `name` | `text` NOT NULL | `name` | `String` | ✅ |
| `slug` | `text` NOT NULL UNIQUE | `slug` | `String @unique` | ✅ |
| `settings` | `jsonb` DEFAULT '{}' | `settings` | `Json? @default("{}")` | ⚠️ Nullable の相違（Doc: nullable、Prisma: `Json?` — 一致） |
| `workflow_seq` | `integer` NOT NULL DEFAULT 0 | `workflowSeq` | `Int @default(0)` | ✅ |
| `invoice_seq` | `integer` NOT NULL DEFAULT 0 | `invoiceSeq` | `Int @default(0)` | ✅ |
| `deleted_at` | `timestamptz` nullable | `deletedAt` | `DateTime?` | ✅ |
| `created_at` | `timestamptz` NOT NULL DEFAULT now() | `createdAt` | `DateTime @default(now())` | ✅ |
| `updated_at` | `timestamptz` NOT NULL DEFAULT now() | `updatedAt` | `DateTime @default(now()) @updatedAt` | ✅ |

### 2.2 user_roles

| ドキュメント カラム | 型 (Doc) | Prisma フィールド | 型 (Prisma) | 結果 |
|---|---|---|---|---|
| `id` | `uuid` PK | `id` | `String @id @default(uuid())` | ✅ |
| `user_id` | `uuid` NOT NULL FK→auth.users | `userId` | `String @map("user_id")` | ✅ （FK 先が `users` に変更） |
| `tenant_id` | `uuid` NOT NULL FK→tenants | `tenantId` | `String @map("tenant_id")` | ✅ |
| `role` | `text` NOT NULL CHECK | `role` | `Role` (enum) | ✅ enum で代替 |
| `created_at` | DEFAULT now() | `createdAt` | `DateTime @default(now())` | ✅ |
| UNIQUE(user_id, tenant_id, role) | — | `@@unique([userId, tenantId, role])` | — | ✅ |
| INDEX(tenant_id, user_id) | — | `@@index([tenantId, userId])` | — | ✅ |
| INDEX(user_id) | — | `@@index([userId])` | — | ✅ |

### 2.3 projects

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| 全 12 カラム | 全て対応 | ✅ 一致 |
| INDEX(tenant_id, status) | `@@index([tenantId, status])` | ✅ |
| INDEX(tenant_id, pm_id) | `@@index([tenantId, pmId])` | ✅ |

### 2.4 project_members

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| 全 5 カラム | 全て対応 | ✅ 一致 |
| UNIQUE(project_id, user_id) | `@@unique([projectId, userId])` | ✅ |
| INDEX(tenant_id, user_id) | `@@index([tenantId, userId])` | ✅ |

### 2.5 tasks

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| 全 11 カラム | 全て対応 | ✅ 一致 |
| `updated_by` | — | ⚠️ ドキュメント共通カラム規約では `updated_by` が必須だが、tasks テーブル定義に記載なし。Prisma にも未定義。ドキュメント内部の不整合 |

### 2.6 workflows

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| 全 15 カラム | 全て対応 | ✅ 一致 |
| `workflow_number` UNIQUE per tenant | `@@unique([tenantId, workflowNumber])` | ✅ |
| 全3インデックス | 全て対応 | ✅ |

### 2.7 timesheets

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| 全 10 カラム | 全て対応 | ✅ 一致 |
| UNIQUE(user_id, project_id, task_id, work_date) | `@@unique([userId, projectId, taskId, workDate])` | ✅ |
| 全2インデックス | 全て対応 | ✅ |

### 2.8 expenses

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| 全 12 カラム | 全て対応 | ✅ 一致 |

### 2.9 audit_logs

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| 全 10 カラム | 全て対応 | ✅ 一致 |
| INDEX(tenant_id, created_at DESC) | `@@index([tenantId, createdAt(sort: Desc)])` | ✅ |
| INDEX(tenant_id, resource_type, resource_id) | `@@index([tenantId, resourceType, resourceId])` | ✅ |
| INDEX(tenant_id, user_id) | `@@index([tenantId, userId])` | ✅ |

### 2.10 notifications

全カラム・インデックス一致 ✅

### 2.11 workflow_attachments

| 項目 | 結果 |
|---|---|
| 全カラム | ✅ 一致 |
| FK→workflows ON DELETE CASCADE | `onDelete: Cascade` | ✅ |
| INDEX(tenant_id, workflow_id) | `@@index([tenantId, workflowId])` | ✅ |

### 2.12 profiles

| ドキュメント カラム | Prisma フィールド | 結果 |
|---|---|---|
| `id` PK FK→auth.users ON DELETE CASCADE | `id` + `@relation(onDelete: Cascade)` | ✅ （FK 先が `users` に変更） |
| `display_name` | `displayName` | ✅ |
| `avatar_url` | `avatarUrl` | ✅ |
| `updated_at` | `updatedAt` | ✅ |

### 2.13 invoices

| 項目 | 結果 |
|---|---|
| 全 16 カラム | ✅ 一致 |
| UNIQUE(tenant_id, invoice_number) | `@@unique([tenantId, invoiceNumber])` | ✅ |
| 全3インデックス | ✅ |

### 2.14 invoice_items

| 項目 | 結果 |
|---|---|
| 全 8 カラム | ✅ 一致 |
| FK→invoices ON DELETE CASCADE | `onDelete: Cascade` | ✅ |

### 2.15 documents

全カラム・インデックス一致 ✅

### 2.16 User モデル（実装のみ）

ドキュメントでは `auth.users`（Supabase 管理）を前提としており、カラム定義なし。  
実装の `User` モデルには以下のフィールドがある:

| フィールド | 型 | 備考 |
|---|---|---|
| `id` | `String @id @default(uuid())` | — |
| `email` | `String @unique` | — |
| `password` | `String` | bcrypt ハッシュ |
| `createdAt` | `DateTime @default(now())` | — |
| `updatedAt` | `DateTime @default(now()) @updatedAt` | — |

---

## 3. RLS ポリシー → 実装の突き合わせ

ドキュメントは Supabase の PostgreSQL RLS（`auth.uid()`, `get_user_tenant_ids()`, `has_role()` 等）を前提としている。  
実装は **NestJS + Prisma** に移行しており、RLS の代替として以下の 3 層で実現:

1. **Prisma `$extends` Tenant Middleware** — テナント分離の自動適用
2. **Prisma `$extends` AuditLog Middleware** — 監査ログの append-only 保護
3. **NestJS `RolesGuard` + `@Roles` デコレータ** — ロールベースアクセス制御

### 3.1 テナント分離

| ドキュメント (RLS) | 実装 | 状態 |
|---|---|---|
| 全業務テーブルに `tenant_id IN (SELECT get_user_tenant_ids())` | `tenant.middleware.ts` の `TENANT_MODELS` リストで自動フィルタ | ✅ 実装済み |
| 対象テーブル: tenants, profiles, user_roles, projects, project_members, tasks, workflows, timesheets, expenses, audit_logs, notifications, workflow_attachments, invoices, invoice_items, documents | `TENANT_MODELS`: Project, ProjectMember, Task, Workflow, Timesheet, Expense, Notification, AuditLog, Invoice, InvoiceItem, Document, WorkflowAttachment, UserRole | ⚠️ 下記参照 |

> [!WARNING]
> **Tenant Middleware 対象外モデル**:
> - `Tenant` — ドキュメントでは RLS で `id IN (get_user_tenant_ids())` としているが、Middleware 対象外。テナント自身のテナント分離は個別実装が必要
> - `Profile` — ドキュメントでは同テナントメンバーの profiles のみ閲覧可能としているが、Middleware 対象外。`Profile` は `tenant_id` カラムを持たない設計のため妥当だが、同テナント制限はアプリ層でカバーされているか要確認

### 3.2 テーブル別 RLS → 実装マッピング

| テーブル | RLS ポリシー (Doc) | 実装状況 | 乖離 |
|---|---|---|---|
| **tenants** | SELECT: テナントメンバー + deleted_at IS NULL / UPDATE: tenant_admin のみ | テナント管理コントローラに `@Roles('tenant_admin')` | ⚠️ `deleted_at IS NULL` フィルタがミドルウェアレベルで自動適用されていない。サービス層での個別実装が必要 |
| **profiles** | SELECT: 同テナントメンバー + 本人 / UPDATE: 本人のみ / INSERT: トリガー経由 | `getProfile()` はログインユーザー自身のみ取得。同テナントメンバーの閲覧ロジックは要確認 | ⚠️ 同テナントメンバーの profiles 閲覧制限が不明確 |
| **user_roles** | SELECT: 同テナント / INSERT/DELETE: tenant_admin のみ | `@Roles('tenant_admin')` on admin controllers | ✅ 概ね一致 |
| **projects** | SELECT: テナントメンバー / INSERT: PM or tenant_admin / UPDATE: PM(自PJ) or tenant_admin | `@Roles('pm', 'tenant_admin')` on create/update/delete | ⚠️ SELECT に全ロールを許可する `@Roles` 指定なし（JwtAuth のみでアクセス可能は OK）。UPDATE は「自分が PM のプロジェクトのみ」制限がアプリ層サービスで実装されているか要確認 |
| **project_members** | SELECT: テナントメンバー / INSERT/DELETE: PM(担当PJ) or tenant_admin | 明示的なコントローラが見当たらない | ⚠️ projects 関連の API 内で処理されている可能性あり |
| **tasks** | SELECT: テナントメンバー / INSERT: PM(担当PJ) or tenant_admin / UPDATE: テナントメンバー | `@Roles('pm')` on create のみ。update はロール制限なし | ⚠️ INSERT で tenant_admin が許可されていない（Doc では許可） |
| **workflows** | SELECT: 申請者 or 承認者 or tenant_admin / INSERT: テナントメンバー(created_by=自分) / UPDATE: 条件付き | `@Roles('approver', 'tenant_admin')` on approve/reject, `@Roles('member', 'pm', 'accounting', 'approver', 'tenant_admin')` on create | ⚠️ SELECT の「申請者本人 or 承認者 or tenant_admin のみ」制限がコントローラレベルでは未実装。サービス層での WHERE 条件に依存 |
| **timesheets** | SELECT: 本人 + PM(担当PJ) + tenant_admin / INSERT/UPDATE/DELETE: 本人のみ | `@Roles('pm', 'accounting', 'tenant_admin')` on summary endpoints | ⚠️ 基本 CRUD にロール制限なし。本人のみ制限はサービス層依存 |
| **expenses** | SELECT: 作成者 or accounting or tenant_admin / INSERT: テナントメンバー(created_by=自分) / UPDATE: 条件付き | CRUD にロール制限なし, summary に `@Roles('pm', 'accounting', 'tenant_admin')` | ⚠️ SELECT の作成者制限はサービス層依存。pm が summary にアクセスできるのはドキュメントの「経費承認/集計: Accounting, Tenant Admin」と乖離 |
| **audit_logs** | SELECT: it_admin or tenant_admin / INSERT のみ許可 / UPDATE/DELETE 禁止 | `@Roles('tenant_admin')` on controller, `enforceAuditLogAppendOnly` middleware | ⚠️ it_admin がコントローラの `@Roles` に含まれていない |
| **notifications** | SELECT/UPDATE: 本人のみ / INSERT: テナントメンバー | ロール制限なし、本人フィルタはサービス層 | ✅ 概ね妥当 |
| **workflow_attachments** | SELECT: テナントメンバー / INSERT: uploaded_by=自分 | テナントミドルウェアで分離 | ✅ 概ね妥当 |
| **invoices** | SELECT: accounting or tenant_admin or PM(自PJ) / INSERT/UPDATE: accounting or tenant_admin / DELETE: accounting or tenant_admin + draft のみ | `@Roles('pm', 'accounting', 'tenant_admin')` on controller | ⚠️ PM は SELECT（自 PJ の請求のみ）に制限されるべきだが、コントローラレベルでは CRUD 全体に pm を許可 |
| **invoice_items** | 親 invoices のポリシーに準拠 | invoices と同じコントローラ内で処理 | ✅ 概ね妥当 |
| **documents** | SELECT: PJ メンバー or PM or tenant_admin / INSERT/DELETE: PM or tenant_admin | `@Roles('member', 'pm', 'tenant_admin')` on findAll/findOne, `@Roles('pm', 'tenant_admin')` on upload/delete | ⚠️ SELECT で member を許可しているがドキュメントでは「プロジェクトメンバー」制限。member = 全メンバーではない点に注意 |

### 3.3 RLS ヘルパー関数

| ドキュメント | 実装 | 状態 |
|---|---|---|
| `get_user_tenant_ids()` SQL 関数 | `tenant.middleware.ts` の `AsyncLocalStorage` ベースの `tenantStore` | ✅ 代替実装あり |
| `has_role(p_tenant_id, p_role)` SQL 関数 | `RolesGuard` + `CurrentUser.roles` のテナントフィルタ | ✅ 代替実装あり |
| `auth.uid()` | `CurrentUser` decorator (`req.user.id`) | ✅ 代替実装あり |

---

## 4. ロール定義の突き合わせ

### 4.1 ロール一覧

| ドキュメント | Prisma enum `Role` | shared `Role` enum | 結果 |
|---|---|---|---|
| member | `member` | `MEMBER = 'member'` | ✅ |
| approver | `approver` | `APPROVER = 'approver'` | ✅ |
| pm | `pm` | `PM = 'pm'` | ✅ |
| accounting | `accounting` | `ACCOUNTING = 'accounting'` | ✅ |
| it_admin | `it_admin` | `IT_ADMIN = 'it_admin'` | ✅ |
| tenant_admin | `tenant_admin` | `TENANT_ADMIN = 'tenant_admin'` | ✅ |

**全 6 ロールが完全一致** ✅

### 4.2 権限マトリクスとの乖離

| 画面/機能 | ドキュメント必要ロール | 実装 `@Roles` | 乖離 |
|---|---|---|---|
| 監査ログ閲覧 | IT Admin, Tenant Admin | `@Roles('tenant_admin', 'it_admin')` | ✅ 修正済み (I-1) |
| 経費承認/集計 | Accounting, Tenant Admin | `@Roles('pm', 'accounting', 'tenant_admin')` | ⚠️ pm が追加されている |
| タスク作成 | PM, Tenant Admin | `@Roles('pm', 'tenant_admin')` | ✅ 修正済み (I-3) |
| 請求管理（全体） | Accounting, Tenant Admin (CRUD) / PM (閲覧のみ) | PM は閲覧のみに制限済み | ✅ 修正済み (I-2) |
| ワークフロー申請作成 | Member, PM, Accounting, Tenant Admin | `@Roles('member', 'pm', 'accounting', 'tenant_admin')` | ✅ 修正済み (I-4) |
| ダッシュボード PJ 情報 | PM, Tenant Admin | `@Roles('pm', 'tenant_admin')` | ✅ 一致 |

---

## 5. リレーションの突き合わせ

### 5.1 ER 図記載のリレーション

| ドキュメント リレーション | Prisma リレーション | 結果 |
|---|---|---|
| tenants ─o{ user_roles | `Tenant.userRoles` ↔ `UserRole.tenant` | ✅ |
| tenants ─o{ projects | `Tenant.projects` ↔ `Project.tenant` | ✅ |
| tenants ─o{ workflows | `Tenant.workflows` ↔ `Workflow.tenant` | ✅ |
| tenants ─o{ audit_logs | `Tenant.auditLogs` ↔ `AuditLog.tenant` | ✅ |
| tenants ─o{ invoices | `Tenant.invoices` ↔ `Invoice.tenant` | ✅ |
| tenants ─o{ documents | `Tenant.documents` ↔ `Document.tenant` | ✅ |
| auth_users ─── profiles | `User.profile` ↔ `Profile.user` (1:1) | ✅ |
| auth_users ─o{ user_roles | `User.roles` ↔ `UserRole.user` | ✅ |
| projects ─o{ project_members | `Project.members` ↔ `ProjectMember.project` | ✅ |
| projects ─o{ tasks | `Project.tasks` ↔ `Task.project` | ✅ |
| projects ─o{ timesheets | `Project.timesheets` ↔ `Timesheet.project` | ✅ |
| projects ─o{ expenses | `Project.expenses` ↔ `Expense.project` | ✅ |
| projects ─o{ invoices | `Project.invoices` ↔ `Invoice.project` | ✅ |
| projects ─o{ documents | `Project.documents` ↔ `Document.project` | ✅ |
| tasks ─o{ timesheets | `Task.timesheets` ↔ `Timesheet.task` | ✅ |
| workflows ─o{ expenses | `Workflow.expenses` ↔ `Expense.workflow` | ✅ |
| workflows ─o{ workflow_attachments | `Workflow.attachments` ↔ `WorkflowAttachment.workflow` | ✅ |
| invoices ─o{ invoice_items | `Invoice.items` ↔ `InvoiceItem.invoice` | ✅ |

**全 18 リレーションが完全一致** ✅

### 5.2 追加リレーション（ドキュメント ER 図に未記載だが実装済み）

Prisma スキーマには ER 図に記載のない以下のリレーションが定義されている（FK 制約として妥当）:

| リレーション | 備考 |
|---|---|
| `User.managedProjects` (ProjectManager) | projects.pm_id のリレーション |
| `User.createdProjects` (ProjectCreator) | projects.created_by のリレーション |
| `User.updatedProjects` (ProjectUpdater) | projects.updated_by のリレーション |
| `User.assignedTasks` (TaskAssignee) | tasks.assignee_id のリレーション |
| `User.createdTasks` (TaskCreator) | tasks.created_by のリレーション |
| `User.createdWorkflows` (WorkflowCreator) | workflows.created_by のリレーション |
| `User.approvedWorkflows` (WorkflowApprover) | workflows.approver_id のリレーション |
| `User.timesheets` | timesheets.user_id のリレーション |
| `User.createdExpenses` (ExpenseCreator) | expenses.created_by のリレーション |
| `User.auditLogs` | audit_logs.user_id のリレーション |
| `User.notifications` | notifications.user_id のリレーション |
| `User.createdInvoices` (InvoiceCreator) | invoices.created_by のリレーション |
| `User.uploadedDocuments` (DocumentUploader) | documents.uploaded_by のリレーション |

これらは FK 制約に基づく正当なリレーションであり、問題なし。

---

## 6. その他の乖離・注意点

### 6.1 アーキテクチャの移行

| 項目 | ドキュメント | 実装 |
|---|---|---|
| DB アクセス | Supabase Client (anon key + RLS) | Prisma Client (service role 相当) |
| 認証 | Supabase Auth (GoTrue) + JWT Cookie | NestJS Passport JWT + bcrypt |
| RLS | PostgreSQL ネイティブ RLS | Prisma `$extends` ミドルウェア + NestJS ガード |
| ヘルパー関数 | `get_user_tenant_ids()`, `has_role()` SQL 関数 | `AsyncLocalStorage` + `RolesGuard` |
| プロファイル作成 | DB トリガー (`handle_new_user()`) | `AuthService.register()` 内でアプリ層作成 |

### 6.2 RLS ポリシーのカバレッジギャップ

ドキュメントの RLS ポリシーは DB レベルで全操作を制御しているが、実装ではアプリ層（NestJS ガード + サービス層ロジック）に移行している。  
以下のポリシーがアプリ層で十分にカバーされているか要確認:

| ポリシー | カバレッジ |
|---|---|
| workflows SELECT: 申請者 or 承認者 or tenant_admin のみ | ⚠️ サービス層の WHERE 条件に依存。ガードレベルでは制限なし |
| timesheets SELECT: 本人 + PM(担当PJ) + tenant_admin | ⚠️ サービス層に依存 |
| expenses SELECT: 作成者 or accounting or tenant_admin | ⚠️ サービス層に依存 |
| expenses UPDATE: ワークフロー draft 時のみ | ⚠️ ドキュメントでもアプリ層チェックを明記しているが、実装確認が必要 |
| invoices DELETE: draft 状態のみ | ⚠️ サービス層で実装されているか要確認 |
| documents SELECT: プロジェクトメンバー制限 | ⚠️ コントローラでは member ロール全体に許可 |

### 6.3 RPC 関数の移行

| ドキュメント | 実装 | 状態 |
|---|---|---|
| `next_workflow_number(p_tenant_id)` SQL 関数 | `WorkflowsService` 内でアプリ層実装 | ✅ 代替実装あり |
| `next_invoice_number(p_tenant_id)` SQL 関数 | `InvoicesService.generateInvoiceNumber()` | ✅ 代替実装あり |

> [!NOTE]
> ドキュメントでは `SELECT FOR UPDATE` による行ロックで並行安全性を担保しているが、アプリ層実装では Prisma トランザクション内で処理されている。
> 高負荷環境での並行安全性は `SELECT FOR UPDATE` 相当の制御がないため、レースコンディションのリスクがある。

### 6.4 トリガー/関数の移行

| ドキュメント | 実装 | 状態 |
|---|---|---|
| `handle_new_user()` トリガー | `AuthService.register()` でアプリ層実装 | ✅ |
| `handle_user_updated()` トリガー | 未確認（プロファイル更新 API 内で実装されている可能性） | ⚠️ 要確認 |
| `profiles_updated_at` トリガー | Prisma `@updatedAt` で代替 | ✅ |
| `update_updated_at()` 共通関数 | Prisma `@updatedAt` で代替 | ✅ |

---

## 7. サマリー

### 一致項目

| カテゴリ | 結果 |
|---|---|
| テーブル/モデル存在 (15/15) | ✅ 完全一致 |
| ロール定義 (6/6) | ✅ 完全一致 |
| リレーション (18/18) | ✅ 完全一致 |
| カラム/フィールド名・型 | ✅ ほぼ完全一致 |
| インデックス | ✅ 全て反映済み |
| UNIQUE 制約 | ✅ 全て反映済み |
| CASCADE 制約 | ✅ 全て反映済み |

### 要注意の乖離

| # | 乖離 | 重大度 | 備考 |
|---|---|---|---|
| D-1 | Supabase `auth.users` → カスタム `users` テーブルへの移行 | 🔴 高 | アーキテクチャ変更。ドキュメント更新が必要 |
| D-2 | PostgreSQL ネイティブ RLS → Prisma ミドルウェア + NestJS ガードへ移行 | 🔴 高 | セキュリティモデルの根本変更。ドキュメント更新が必要 |
| D-3 | 監査ログの `@Roles` に `it_admin` が含まれていない | ✅ 修正済み | I-1 で対応済み |
| D-4 | 請求書コントローラで PM に CRUD 全権限が付与されている | ✅ 修正済み | I-2 で対応済み |
| D-5 | タスク作成の `@Roles` に `tenant_admin` が含まれていない | ✅ 修正済み | I-3 で対応済み |
| D-6 | ワークフロー申請作成に `approver` が追加されている | ✅ 修正済み | I-4 で対応済み |
| D-7 | 経費サマリーに `pm` が追加されている | 🟠 低 | ドキュメントでは Accounting + Tenant Admin のみ |
| D-8 | `Tenant` がテナントミドルウェア対象外 | 🟠 低 | `deleted_at IS NULL` フィルタがミドルウェアで自動適用されない |
| D-9 | ワークフロー/タイムシート/経費の SELECT 行レベル制限がガードにない | 🟡 中 | サービス層 WHERE 条件に依存。バイパスリスクを評価する必要あり |
| D-10 | `next_workflow_number` / `next_invoice_number` の並行安全性 | 🟠 低 | DB 行ロック → Prisma トランザクションへの移行でレースコンディションの可能性 |

---

*本レポートは差異の指摘のみを目的としています。修正は行いません。*
