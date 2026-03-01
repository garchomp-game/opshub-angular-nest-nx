# TI-P4-03: D-6 ワークフロー添付ファイル機能

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
ワークフロー（申請）にファイルを添付する機能の全体実装。
Prisma スキーマ (`WorkflowAttachment` モデル) は既に存在するため、API + Web + テストを実装する。

## 前提条件
- `WorkflowAttachment` モデルは Prisma スキーマに定義済み（`libs/prisma-db/prisma/schema.prisma` を確認）
- `WorkflowsModule` / `WorkflowsService` / `WorkflowsController` は既に存在
- ファイルストレージは **ローカルディスク** (`uploads/workflow-attachments/` ディレクトリ) を使用
- `@nestjs/platform-express` は既にインストール済み（確認: `pnpm list @nestjs/platform-express`）
  - 未インストールの場合: `pnpm add @nestjs/platform-express`
  - multer 型: `pnpm add -D @types/multer`

## 作業内容

### 1. ALLOWED_MIME_TYPES 定数
`libs/shared/types/src/lib/constants/` 配下に存在するか確認。なければ作成:

ファイル: `libs/shared/types/src/lib/constants/allowed-mime-types.ts`
```typescript
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```
バレルエクスポート (`index.ts`) への追加も忘れずに。

### 2. API — Controller エンドポイント追加
ファイル: `apps/api/src/modules/workflows/workflows.controller.ts`

```typescript
@Post(':id/attachments')
@UseInterceptors(FileInterceptor('file', { ... }))
async uploadAttachment(...) { ... }

@Get(':id/attachments')
async getAttachments(...) { ... }

@Delete(':id/attachments/:attachmentId')
async deleteAttachment(...) { ... }

@Get(':id/attachments/:attachmentId/download')
async downloadAttachment(...) { ... }
```

multer の設定:
- `storage`: `diskStorage` で `uploads/workflow-attachments/` に保存
- `limits`: `fileSize: MAX_FILE_SIZE` (10MB)
- `fileFilter`: `ALLOWED_MIME_TYPES` でフィルタ

### 3. API — Service メソッド追加
ファイル: `apps/api/src/modules/workflows/workflows.service.ts`

- `uploadAttachment(tenantId, workflowId, file, userId)` — DB 保存 + ファイルパス記録
- `getAttachments(tenantId, workflowId)` — 添付ファイル一覧
- `deleteAttachment(tenantId, workflowId, attachmentId, userId)` — 削除 (権限チェック: 本人 or tenant_admin)
- `getAttachmentFile(tenantId, workflowId, attachmentId)` — ファイル情報取得

### 4. Web — ファイルアップロード UI
ファイル: `apps/web/src/app/features/workflows/workflow-detail.component.ts` を更新

- PrimeNG `FileUpload` コンポーネントを使用
- 添付ファイル一覧表示（ファイル名、サイズ、アップロード日時）
- ダウンロードリンク
- 削除ボタン（本人 or tenant_admin のみ表示）
- ドラッグ&ドロップ対応

### 5. Web — Service メソッド追加
ファイル: `apps/web/src/app/features/workflows/workflow.service.ts`

- `uploadAttachment(workflowId, file: File)` — `FormData` で POST
- `getAttachments(workflowId)` — GET 添付一覧
- `deleteAttachment(workflowId, attachmentId)` — DELETE
- `downloadAttachment(workflowId, attachmentId)` — Blob ダウンロード

### 6. .gitignore 更新
`uploads/` を `.gitignore` に追加（まだなければ）

### 7. テスト
- `workflows.controller.spec.ts` に添付ファイル CRUD テスト追加
- `workflows.service.spec.ts` に添付ファイルメソッドのテスト追加
- MIME タイプバリデーション、ファイルサイズ上限テスト
- 権限チェックテスト（本人以外の削除拒否）

### 8. ビルド・テスト確認
```bash
pnpm nx build api
pnpm nx build web
pnpm nx test api
pnpm nx test web
```

## 参照ファイル
- `libs/prisma-db/prisma/schema.prisma` — `WorkflowAttachment` モデル
- `apps/api/src/modules/workflows/workflows.controller.ts`
- `apps/api/src/modules/workflows/workflows.service.ts`
- `apps/web/src/app/features/workflows/workflow-detail.component.ts`
- `apps/web/src/app/features/workflows/workflow.service.ts`

## ドキュメント参照（任意）
- `nx-angular-nestjs-doc/src/content/docs/spec/apis.md` §API-B01 (ワークフロー)
- `nx-angular-nestjs-doc/src/content/docs/detail/modules/workflow.md`

## 完了条件
- [ ] ファイルアップロード（D&D 対応）が動作する
- [ ] アップロード済みファイルの一覧表示
- [ ] ファイルダウンロードが動作する
- [ ] ファイル削除（権限チェック付き）が動作する
- [ ] MIME タイプ / ファイルサイズのバリデーションが動作する
- [ ] 全テストがパスする
- [ ] `pnpm nx build web` + `pnpm nx build api` 成功
