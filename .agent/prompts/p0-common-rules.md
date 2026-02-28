# PrimeNG 移行 — 全チケット共通ルール

## 環境
- Angular 21 + PrimeNG 21.1.1 (Aura テーマ)
- Tailwind CSS v4 (レイアウト用ユーティリティのみ)
- PrimeIcons 7.0.0
- llms.txt 参照: `.agent/llms-txt/primeNG-llms-full.txt`

## DaisyUI → PrimeNG 変換ルール

### コンポーネント

| DaisyUI (現コード) | PrimeNG (変換後) | import |
|---|---|---|
| `class="btn btn-primary"` | `<p-button>` | `ButtonModule` from `primeng/button` |
| `class="table table-zebra"` | `<p-table [stripedRows]="true">` | `TableModule` from `primeng/table` |
| `class="card"` | `<p-card>` | `CardModule` from `primeng/card` |
| `class="badge badge-*"` | `<p-tag [severity]="...">` | `TagModule` from `primeng/tag` |
| `class="select"` | `<p-select>` | `SelectModule` from `primeng/select` |
| `class="input"` | `pInputText` directive | `InputTextModule` from `primeng/inputtext` |
| `class="textarea"` | `pTextarea` directive | `TextareaModule` from `primeng/textarea` |
| `<div class="join">` (pagination) | `<p-paginator>` | `PaginatorModule` from `primeng/paginator` |
| `class="loading loading-spinner"` | `<p-progressSpinner>` | `ProgressSpinnerModule` from `primeng/progressspinner` |
| `class="tabs"` | `<p-tabs>` | `TabsModule` from `primeng/tabs` |
| `class="drawer"` | `<p-drawer>` | `DrawerModule` from `primeng/drawer` |
| `class="modal"` | `<p-dialog>` | `DialogModule` from `primeng/dialog` |
| `class="avatar"` | `<p-avatar>` | `AvatarModule` from `primeng/avatar` |
| `class="progress"` | `<p-progressbar>` | `ProgressBarModule` from `primeng/progressbar` |

### アイコン

| ng-icons (旧) | PrimeIcons (新) |
|---|---|
| `<ng-icon name="heroPlus">` | `icon="pi pi-plus"` or `<i class="pi pi-plus">` |
| `<ng-icon name="heroArrowLeft">` | `icon="pi pi-arrow-left"` |
| `<ng-icon name="heroPaperAirplane">` | `icon="pi pi-send"` |
| `<ng-icon name="heroInboxStack">` | `<i class="pi pi-inbox">` |
| `<ng-icon name="heroMagnifyingGlass">` | `icon="pi pi-search"` |
| `<ng-icon name="heroPencil">` | `icon="pi pi-pencil"` |
| `<ng-icon name="heroTrash">` | `icon="pi pi-trash"` |
| `<ng-icon name="heroEye">` | `icon="pi pi-eye"` |
| `<ng-icon name="heroCalendar">` | `icon="pi pi-calendar"` |
| `<ng-icon name="heroUser">` | `icon="pi pi-user"` |

### CSS 変数

| DaisyUI 変数 (旧) | PrimeNG デザイントークン (新) |
|---|---|
| `text-base-content` | `color: var(--p-text-color)` |
| `text-base-content/60` | `opacity: 0.6` or `color: var(--p-text-muted-color)` |
| `bg-base-100` | `background: var(--p-surface-card)` |
| `bg-base-200` | `background: var(--p-surface-ground)` |
| `border-base-200` | `border-color: var(--p-surface-border)` |
| `text-error` | `color: var(--p-red-500)` or `class="text-red-500"` |
| `text-success` | `color: var(--p-green-500)` |

### ステータスバッジの severity マッピング

| ステータス | DaisyUI class | PrimeNG severity |
|---|---|---|
| 承認済 / 完了 / 成功 | `badge-success` | `'success'` |
| 差戻し / エラー | `badge-error` | `'danger'` |
| 申請中 / 進行中 | `badge-warning` | `'warn'` |
| 下書き / 未着手 | `badge-ghost` | `'secondary'` |
| 取下げ / 無効 | `badge-ghost` | `'contrast'` |
| 情報 | `badge-info` | `'info'` |

## 削除対象 import (必ず削除)

```typescript
// 以下を全て削除
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroXxx } from '@ng-icons/heroicons/outline';
import { ListPageComponent } from '../../shared/ui/page-layouts/list-page.component';
import { FormPageComponent } from '../../shared/ui/page-layouts/form-page.component';
import { FormFieldComponent } from '../../shared/ui/form-field/form-field.component';
import { DataTableComponent } from '../../shared/ui/data-table/data-table.component';
import { AppSelectComponent } from '../../shared/ui/select/app-select.component';

// 以下は維持 (PrimeNG 委譲済み)
import { ToastService } from '../../shared/ui/toast/toast.service';  // OK
import { ModalService } from '../../shared/ui/modal/modal.service';  // OK
```

## 共通ルール
1. PrimeNG コンポーネントを直接 import して使用
2. `shared/ui` のラッパーコンポーネントは使用禁止 (ToastService/ModalService 除く)
3. `@ng-icons` を全て PrimeIcons に置換
4. `viewProviders: [provideIcons(...)]` を削除
5. 既存ロジック (Signal, Service, Router) は変更禁止
6. `data-testid` 属性を維持
7. 日本語 UI を維持
8. 完了後: `pnpm nx build web` で確認
