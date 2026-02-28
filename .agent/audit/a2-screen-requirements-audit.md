# A2: 画面仕様 + 要件定義 突き合わせ監査レポート

**監査日**: 2026-02-27
**対象ドキュメント**: `opsHub-doc/src/content/docs/requirements/` / `opsHub-doc/src/content/docs/spec/screens/` / `opsHub-doc/src/content/docs/spec/ui-layout/`
**対象実装**: `opshub/apps/web/src/app/` 配下

---

## 0. 全体的な乖離（フレームワーク・UIライブラリ）

> [!CAUTION]
> ドキュメントと実装でフレームワーク・UIライブラリが完全に異なる。

| 項目 | ドキュメント記載 | 実装 |
|---|---|---|
| **フレームワーク** | Next.js (React) — `page.tsx`, React Server Component, `useRouter` 等 | **Angular 19** — standalone components, `@angular/router` |
| **UIライブラリ** | Ant Design (`Table`, `Form`, `Layout`, `Card`, `Modal` 等) | **DaisyUI + Tailwind CSS** |
| **アイコン** | `@ant-design/icons` (`BellOutlined`, `FileTextOutlined` 等) | **@ng-icons/heroicons** (`heroHome`, `heroDocumentText` 等) |
| **状態管理** | React `useState`, `useTransition`, Server Actions | Angular Signals, Services, RxJS |
| **ファイル拡張子** | `.tsx` | `.ts` (Angular standalone components, inline templates) |

ドキュメント内の全ての技術的記述（コンポーネント名、import文、React固有パターン等）は実装と一致しない。

---

## 1. 画面存在チェック

### ドキュメント記載画面 → 実装マッピング

| # | 画面名 | SPEC-SCR | ドキュメントURL | 実装URL | 実装コンポーネント | 判定 |
|---|---|---|---|---|---|---|
| 01 | ログイン | SCR-001 | `/login` | `/login` | `LoginComponent` | ✅ 一致 |
| 02 | ダッシュボード | SCR-002 | `/dashboard` | `/dashboard` | `DashboardComponent` | ✅ 一致 |
| 03 | テナント管理 | SCR-A01 | `/admin/tenants` | `/admin/tenant` | `TenantSettingsComponent` | ⚠️ URL差異 |
| 04 | ユーザー管理 | SCR-A02 | `/settings/users` | `/admin/users` | `UserListComponent` | ⚠️ URL差異 |
| 05 | 監査ログビューア | SCR-A03 | `/admin/audit-logs` | `/admin/audit-logs` | `AuditLogViewerComponent` | ✅ 一致 |
| 06 | 申請一覧 | SCR-B01 | `/workflows` | `/workflows` | `WorkflowListComponent` | ✅ 一致 |
| 07 | 申請作成 | SCR-B02 | `/workflows/new` | `/workflows/new` | `WorkflowFormComponent` | ✅ 一致 |
| 08 | 申請詳細/承認 | SCR-B03 | `/workflows/[id]` | `/workflows/:id` | `WorkflowDetailComponent` | ✅ 一致 |
| 09 | プロジェクト一覧 | SCR-C01-1 | `/projects` | `/projects` | `ProjectListComponent` | ✅ 一致 |
| 10 | プロジェクト詳細 | SCR-C01-2 | `/projects/[id]` | `/projects/:id` | `ProjectDetailComponent` | ✅ 一致 |
| 11 | タスク管理 | SCR-C02 | `/projects/[id]/tasks` | `/projects/:id/tasks` | `KanbanBoardComponent` | ✅ 一致 |
| 12 | 工数入力 | SCR-C03-1 | `/timesheet` | `/timesheets` | `TimesheetWeeklyComponent` | ⚠️ URL差異 |
| 13 | 工数集計 | SCR-C03-2 | `/timesheet/summary` | `/timesheets/reports` | `TimesheetReportComponent` | ⚠️ URL差異 |
| 14 | 経費一覧 | SCR-D01 | `/expenses` | `/expenses` | `ExpenseListComponent` | ✅ 一致 |
| 15 | 経費申請 | SCR-D01 | `/expenses/new` | `/expenses/new` | `ExpenseFormComponent` | ✅ 一致 |
| 16 | 経費集計 | SCR-D03 | `/expenses/summary` | `/expenses/summary` | `ExpenseSummaryComponent` | ✅ 一致 |
| 17 | 請求一覧 | SCR-H01 | `/invoices` | `/invoices` | `InvoiceListComponent` | ✅ 一致 |
| 18 | 請求書詳細/編集 | SCR-H02 | `/invoices/[id]` | `/invoices/:id` | `InvoiceDetailComponent` | ✅ 一致 |
| 19 | ドキュメント管理 | SCR-F01 | `/projects/[id]/docs` | `/projects/:id/documents` | `DocumentListComponent` | ⚠️ URL差異 |
| 20 | 通知 | SCR-E01 | ヘッダー組込 | ヘッダー組込 | `NotificationBellComponent` | ✅ 一致 |
| 21 | 全文検索 | SCR-G02 | `/search` | `/search` | `SearchResultsComponent` | ✅ 一致 |

---

## 2. ルーティング差異の詳細

### URL パス不一致

| # | ドキュメントURL | 実装URL | 差異内容 |
|---|---|---|---|
| 1 | `/admin/tenants` | `/admin/tenant` | 複数形 `tenants` → 単数形 `tenant` |
| 2 | `/settings/users` | `/admin/users` | トップレベルパス `settings` → `admin` 配下に統合 |
| 3 | `/timesheet` | `/timesheets` | 単数形 → 複数形 |
| 4 | `/timesheet/summary` | `/timesheets/reports` | パス名変更（`summary` → `reports`） |
| 5 | `/projects/[id]/docs` | `/projects/:id/documents` | `docs` → `documents` |

---

## 3. 未ドキュメント画面（実装にあるがドキュメントに無い）

| # | 実装URL | コンポーネント | 説明 |
|---|---|---|---|
| 1 | `/workflows/pending` | `WorkflowPendingComponent` | 承認待ち一覧（ドキュメントでは SCR-B01 に記載あるが独立画面としての SPEC は未作成） |
| 2 | `/workflows/:id/edit` | `WorkflowFormComponent` | 申請編集（ドキュメントでは作成のみ記載、編集モードの SPEC なし） |
| 3 | `/projects/new` | `ProjectFormComponent` | プロジェクト新規作成フォーム（SCR-C01-1 で「新規作成」ボタンへの言及はあるが独立 SPEC なし） |
| 4 | `/invoices/new` | `InvoiceFormComponent` | 請求書新規作成フォーム（SCR-H02 で言及はあるが URL 記載は `/invoices/[id]` のみ） |
| 5 | `/invoices/:id/edit` | `InvoiceFormComponent` | 請求書編集（SCR-H02 と統合されているはずだが、実装では別ルート） |
| 6 | `/invoices/:id/print` | `InvoicePrintViewComponent` | 請求書印刷ビュー（SCR-H02 では `window.print()` 方式を想定） |
| 7 | `PlaceholderComponent` | — | 未実装機能用プレースホルダー（ドキュメント記載なし） |

> [!NOTE]
> SCR-B01 は「承認待ち一覧」を `/workflows/pending` として分離実装すると本文中に記載がある。しかし独立した SPEC ドキュメント（UI構成・フィルタ・テーブル列の詳細等）は存在しない。

---

## 4. 未実装画面（ドキュメントにあるが実装に無い画面）

| # | 画面名 | SPEC-SCR | ドキュメントURL | 説明 |
|---|---|---|---|---|
| 1 | 通知一覧（専用ページ） | — | `/notifications` | 要件 `requirements/screens` に記載あり。SCR-E01 はヘッダー内 Popover として実装済みだが、専用ページ `/notifications` は未実装 |
| 2 | パスワードリセット | — | `/reset-password` | UIレイアウト仕様のレイアウト階層図に記載あり。実装なし |

---

## 5. 画面要素の主要な乖離

### 5.1 ダッシュボード（SCR-002）

| 項目 | ドキュメント記載 | 実装状態 |
|---|---|---|
| KPIカード | `Ant Design Statistic + Card hoverable`、最大4枚 | DaisyUI `stat` コンポーネントで `KpiCardComponent` として実装 |
| プロジェクト進捗 | `Ant Design Progress` バー、PMのみ | 実装不明（要コンポーネント内容確認） |
| 通知セクション | `Ant Design List` + `Empty` | NotificationBell として Popover で実装 |
| クイックアクション | 3ボタン（新規申請/工数入力/PJ一覧） | 実装不明（要ダッシュボードコンポーネント内容確認） |
| データ取得方式 | React Server Component + `Promise.all` | Angular Service ベースのデータ取得 |

### 5.2 監査ログビューア（SCR-A03）

| 項目 | ドキュメント記載 | 実装状態 |
|---|---|---|
| テーブル | Ant Design `Table` + Expandable Row | DaisyUI テーブル |
| フィルタ | `DatePicker.RangePicker`, `Select` x3 | DaisyUI フォーム要素 |
| 差分表示 | 展開行で `before_data`/`after_data` の JSON diff | 実装方式は異なるが機能は同等（要確認） |
| ページネーション | サーバーサイド、10/20/50/100件切替 | 実装方式要確認 |

### 5.3 通知（SCR-E01）

| 項目 | ドキュメント記載 | 実装状態 |
|---|---|---|
| コンポーネント | Ant Design `Badge` + `Popover` + `List` | DaisyUI `dropdown` + カスタム実装 |
| SSRデータ取得 | `layout.tsx` (Server Component) で初期データ取得 | Angular `NotificationService` でクライアントサイド取得 |
| リアルタイム更新 | `useTransition` + Server Action | Angular Signals / RxJS |

### 5.4 全文検索（SCR-G02）

| 項目 | ドキュメント記載 | 実装状態 |
|---|---|---|
| 検索バー | Ant Design `Input.Search` + `Cmd+K` ショートカット | `HeaderSearchBarComponent`（DaisyUI） |
| カテゴリタブ | 5タブ（すべて/WF/PJ/タスク/経費）+ 件数バッジ | `SearchResultsComponent`（要詳細確認） |
| ハイライト | `<mark>` タグ | 要確認 |

### 5.5 UIレイアウト全体

| 項目 | ドキュメント記載 | 実装状態 |
|---|---|---|
| レイアウト構成 | Ant Design `Layout`（Header + Sider + Content + Footer） | DaisyUI `drawer` + `navbar`（Footer なし） |
| サイドメニュー | Ant Design `Menu` with `children`（サブメニュー展開） | DaisyUI `menu`（フラットリスト、サブメニューなし） |
| Footer | コピーライト + ヘルプ + 利用規約 + バージョン | **未実装** |
| Breadcrumb | `PageContainer` で自動生成 | **未実装** |
| PageHeader | タイトル + ステータス + アクションボタン | 各コンポーネントで個別実装 |

---

## 6. 要件カタログ（req-catalog）充足度

### Epic A: テナント/組織/権限（Must）

| REQ | 要件名 | 充足度 | 備考 |
|---|---|---|---|
| REQ-A01 | テナント管理 | ⚠️ 部分的 | `TenantSettingsComponent` は存在するが、URL が `/admin/tenants` → `/admin/tenant` に変更。テナント作成・削除等の詳細は要確認 |
| REQ-A02 | ユーザー管理 | ⚠️ 部分的 | `UserListComponent` + `InviteModalComponent` は存在。URL が `/settings/users` → `/admin/users` に変更 |
| REQ-A03 | ロール/権限管理 | ✅ 実装済み | `AuditLogViewerComponent` + `roleGuard` + `authGuard` 実装済み。`AuthService.hasRole()` でロール判定 |

### Epic B: ワークフロー（Must）

| REQ | 要件名 | 充足度 | 備考 |
|---|---|---|---|
| REQ-B01 | 申請作成 | ✅ 実装済み | `WorkflowFormComponent` (`/workflows/new`) |
| REQ-B02 | 承認/差戻し | ✅ 実装済み | `WorkflowDetailComponent` (`/workflows/:id`) |
| REQ-B03 | 申請履歴/ステータス追跡 | ✅ 実装済み | `WorkflowListComponent` + `WorkflowPendingComponent` |

### Epic C: 案件/タスク/工数（Must）

| REQ | 要件名 | 充足度 | 備考 |
|---|---|---|---|
| REQ-C01 | プロジェクト管理 | ✅ 実装済み | `ProjectListComponent` + `ProjectDetailComponent` + `ProjectFormComponent` |
| REQ-C02 | タスク管理 | ✅ 実装済み | `KanbanBoardComponent` (`/projects/:id/tasks`) |
| REQ-C03 | 工数入力/集計 | ⚠️ 部分的 | `TimesheetWeeklyComponent` + `TimesheetReportComponent` は存在するが、URL が `/timesheet` → `/timesheets`、`/timesheet/summary` → `/timesheets/reports` に変更 |

### Epic D: 経費（Should）

| REQ | 要件名 | 充足度 | 備考 |
|---|---|---|---|
| REQ-D01 | 経費申請 | ✅ 実装済み | `ExpenseListComponent` + `ExpenseFormComponent` |
| REQ-D02 | 経費集計/レポート | ✅ 実装済み | `ExpenseSummaryComponent` (`/expenses/summary`) |

### Epic E: 請求（Should）

| REQ | 要件名 | 充足度 | 備考 |
|---|---|---|---|
| REQ-E01 | 請求書管理 | ✅ 実装済み | `InvoiceListComponent` + `InvoiceDetailComponent` + `InvoiceFormComponent` + `InvoicePrintViewComponent` |

### Epic F: ドキュメント（Could）

| REQ | 要件名 | 充足度 | 備考 |
|---|---|---|---|
| REQ-F01 | ドキュメント管理 | ⚠️ 部分的 | `DocumentListComponent` は存在するが URL が `/projects/[id]/docs` → `/projects/:id/documents` に変更 |

### Epic G: 通知/検索/レポート（Could）

| REQ | 要件名 | 充足度 | 備考 |
|---|---|---|---|
| REQ-G01 | 通知 | ⚠️ 部分的 | `NotificationBellComponent` はヘッダー組込で実装済み。ただし専用ページ `/notifications` は未実装 |
| REQ-G02 | 全文検索 | ✅ 実装済み | `SearchResultsComponent` + `HeaderSearchBarComponent` |
| REQ-G03 | ダッシュボード/レポート | ✅ 実装済み | `DashboardComponent` + `KpiCardComponent` |

### 充足度サマリー

| 優先度 | 総数 | 実装済み | 部分的 | 未実装 |
|---|---|---|---|---|
| Must | 9 | 6 | 3 | 0 |
| Should | 3 | 3 | 0 | 0 |
| Could | 3 | 2 | 1 | 0 |
| **合計** | **15** | **11** | **4** | **0** |

---

## 7. サイドバーメニュー構成の差異

| ドキュメント記載（ui-layout） | 実装（AppShellComponent） |
|---|---|
| ダッシュボード | ✅ ダッシュボード |
| 申請（サブメニュー: 申請一覧 / 新規申請） | ⚠️ 申請（フラット、サブメニューなし） |
| プロジェクト | ✅ プロジェクト |
| 工数 | ✅ 工数（ロール制限: `member`, `pm`） |
| 経費 | ✅ 経費 |
| — | ✅ 請求書（ドキュメントのメニュー構成に記載なし） |
| — | ✅ 検索（ドキュメントのメニュー構成に記載なし） |
| 管理（サブメニュー: テナント管理 / ユーザー管理） | ⚠️ 管理（フラット、サブメニューなし） |

**差異ポイント**:
- ドキュメントでは「申請」「管理」にサブメニューがあるが、実装ではフラットリンク
- 「請求書」「検索」はドキュメントのメニュー構成に未記載（画面仕様自体は存在する）
- ドキュメントの工数メニューはロール制限の記載なし、実装では `member`, `pm` のみ

---

## 8. 権限/ガード設定の差異

| 画面 | ドキュメント記載のロール制限 | 実装のルートガード |
|---|---|---|
| 請求書 (`/invoices`) | Accounting, PM | `roleGuard` — `['accounting', 'pm', 'tenant_admin']`（Tenant Admin 追加） |
| 管理 (`/admin`) | IT Admin, Tenant Admin | `roleGuard` — `['tenant_admin', 'it_admin']` ✅ 一致 |
| 承認待ち (`/workflows/pending`) | Approver, Tenant Admin | `roleGuard` — `['approver', 'tenant_admin']` ✅ 一致 |
| ログイン (`/login`) | 全員 | `authGuard` なし（public route） ✅ 一致 |

---

## 9. まとめ

### 重大な乖離

1. **フレームワーク・UIライブラリの全面刷新**: Next.js/Ant Design → Angular/DaisyUI。ドキュメント内の全ての技術的詳細（コンポーネント名、import文、データ取得パターン等）は実装と乖離
2. **Footer 未実装**: ドキュメントで定義された `AppFooter`（コピーライト、ヘルプ、利用規約、バージョン表示）が実装に存在しない
3. **Breadcrumb 未実装**: ドキュメントの `PageContainer` による自動パンくずリストが未実装
4. **通知専用ページ (`/notifications`) 未実装**: 要件一覧に記載あるが実装なし

### 中程度の乖離

5. **URL パス不一致（5箇所）**: `/admin/tenants` → `/admin/tenant`、`/settings/users` → `/admin/users`、`/timesheet` → `/timesheets`、`/timesheet/summary` → `/timesheets/reports`、`/projects/[id]/docs` → `/projects/:id/documents`
6. **未ドキュメント画面（7画面）**: ワークフロー編集、プロジェクト新規作成、請求書新規作成/編集/印刷ビュー等の独立SPECが未作成
7. **サブメニュー構成**: ドキュメントの階層メニューが実装ではフラットリストに変更

### 軽微な乖離

8. **パスワードリセット画面**: ドキュメントで言及あるが実装なし（Supabase Auth のデフォルトフローに委譲の可能性あり）
9. **メニュー項目の追加**: 「請求書」「検索」がサイドメニューに追加されているがドキュメント未反映

---

## 10. 推奨アクション

> [!IMPORTANT]
> 以下は推奨のみ。本監査では修正は行わない。

1. **ドキュメントの技術スタックを更新**: Next.js/Ant Design → Angular/DaisyUI/Heroicons に全面改訂
2. **URL パスをドキュメントに反映**: 実装に合わせて5箇所のURLを更新
3. **未ドキュメント画面のSPEC作成**: `/workflows/pending`, `/workflows/:id/edit`, `/projects/new`, `/invoices/new`, `/invoices/:id/edit`, `/invoices/:id/print` の6画面
4. **UIレイアウト仕様を更新**: DaisyUI `drawer` ベースの現行レイアウトに合わせて改訂
5. **Footer / Breadcrumb の方針決定**: 実装するか、ドキュメントから削除するか判断
6. **要件一覧の `/notifications` ページ**: 実装するか、Popover のみで要件充足とするか判断
