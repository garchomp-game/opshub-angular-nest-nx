# TI-P5-04: ConfirmDialogComponent 廃止 → PrimeNG ConfirmationService 直接利用

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
`@deprecated` の `ConfirmDialogComponent` を完全削除し、ワークフロー関連コンポーネントで `PrimeNG ConfirmationService` を直接利用するように置き換える。

## 現状
- `shared/components/confirm-dialog.component.ts` は空テンプレート (`<!-- Handled by PrimeNG p-confirmdialog in app-shell -->`)
- `ModalService.open(ConfirmDialogComponent, { data: { ... } })` 経由で呼ばれているが、実態は `ConfirmationService.confirm()` に委譲しているだけ
- 使用箇所 (4箇所):
  1. `workflow-detail.component.ts` L387 — ワークフロー承認確認
  2. `workflow-detail.component.ts` L528 — ワークフロー却下確認
  3. `workflow-detail.component.ts` L561 — ワークフロー取下確認
  4. `workflow-pending.component.ts` L94 — 承認/却下確認

## 作業内容

### 1. `workflow-detail.component.ts` のリファクタリング
3箇所の `modalService.open(ConfirmDialogComponent, ...)` を `confirmationService.confirm(...)` に置き換え:

**Before:**
```typescript
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
// ...
const ref = this.modalService.open(ConfirmDialogComponent, {
  data: { title: '承認確認', message: 'このワークフローを承認しますか？', confirmText: '承認' }
});
ref.afterClosed().subscribe(result => {
  if (result) { /* 実行 */ }
});
```

**After:**
```typescript
import { ConfirmationService } from 'primeng/api';
// ...
this.confirmationService.confirm({
  header: '承認確認',
  message: 'このワークフローを承認しますか？',
  acceptLabel: '承認',
  rejectLabel: 'キャンセル',
  accept: () => { /* 実行 */ },
});
```

- `ModalService` の import も不要になれば削除
- `ConfirmationService` を providers に追加（既にある場合は不要）

### 2. `workflow-pending.component.ts` のリファクタリング
1箇所の `modalService.open(ConfirmDialogComponent, ...)` を同様に置き換え。

### 3. `confirm-dialog.component.ts` の削除
- `apps/web/src/app/shared/components/confirm-dialog.component.ts` を削除

### 4. `ModalService` の検討
- `ConfirmDialogComponent` を削除した後、`ModalService` を使用している箇所が他にないか確認
- 他に使用箇所がなければ `modal.service.ts` も削除可能
- 使用箇所がある場合は残す（ただし `ConfirmDialogComponent` の import は不要）

確認コマンド:
```bash
grep -rn "ModalService" apps/web/src --include="*.ts" | grep -v "spec.ts" | grep -v "modal.service.ts"
```

### 5. テスト更新
- `workflow-detail.component.spec.ts` — `ConfirmDialogComponent` / `ModalService` のモックを `ConfirmationService` のモックに置き換え
- `workflow-pending.component.spec.ts` — 同様

### 6. ビルド・テスト確認
```bash
pnpm nx build web
pnpm nx test web
```

## 参照ファイル
- `apps/web/src/app/shared/components/confirm-dialog.component.ts` — 削除対象
- `apps/web/src/app/shared/services/modal.service.ts` — 削除候補
- `apps/web/src/app/features/workflows/workflow-detail.component.ts` — 変更対象 (3箇所)
- `apps/web/src/app/features/workflows/workflow-pending.component.ts` — 変更対象 (1箇所)

## 完了条件
- [ ] `confirm-dialog.component.ts` が削除されている
- [ ] `workflow-detail.component.ts` で `ConfirmationService.confirm()` を直接使用
- [ ] `workflow-pending.component.ts` で `ConfirmationService.confirm()` を直接使用
- [ ] `ConfirmDialogComponent` の import が全ファイルから削除されている
- [ ] `ModalService` が不要であれば `modal.service.ts` も削除
- [ ] 全テストがパスする
- [ ] `pnpm nx build web` 成功
