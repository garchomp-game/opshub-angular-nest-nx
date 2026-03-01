# TI-P6-03: pm-handoff.md + pm-prompt.md 更新

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい

## 概要
`.agent/pm-handoff.md` と `.agent/pm-prompt.md` を Phase 4-5 の完了を反映して更新する。

## pm-prompt.md の更新内容

### 完了済みフェーズ表を更新
```
| Phase 4 | D-3 通知 / D-4 パスワードリセット / D-6 WF添付 | ✅ |
| Phase 5 | I-6 監査ログ / D-8 GIN / D-9 レート制限 / 技術的負債 | ✅ |
```

### テスト状態を更新
```
| API ユニット (Jest)  | 249  | ✅ |
| Web ユニット (Vitest) | 185 | ✅ |
```

### 次のアクション (Phase 6 候補) を更新
- 優先度高を全削除（完了済み）
- 優先度中から I-6, D-8, D-9 を削除（完了済み）
- 新しい候補を追加:
  - ドキュメント全面改訂（進行中）
  - E2E テスト追加
  - CI/CD パイプライン
  - OpenAPI クライアント自動生成
  - BullMQ ジョブキュー

## pm-handoff.md の更新内容

### Phase 4-5 完了タスクを §8 に追記
Phase 4:
- D-3: 通知ページ (`/notifications`)
- D-4: パスワードリセット (メール基盤 + Web 画面)
- D-6: WF 添付ファイル (multer + PrimeNG FileUpload)

Phase 5:
- I-6: 監査ログ INSERT ONLY (DB RULE)
- D-8: 検索 GIN インデックス (pg_trgm)
- D-9: レート制限 (@nestjs/throttler)
- ConfirmDialogComponent 廃止

### §3 テスト件数更新
```
pnpm nx test api           # API ユニットテスト (249 テスト)
pnpm nx test web           # Web ユニットテスト (185 テスト)
```

### §4 プロジェクト構造更新
- `modules/mail/` を追加
- `core/auth/forgot-password/`, `core/auth/reset-password/` を追加
- `features/notifications/` を追加

### §6 技術的注意点更新
- ConfirmDialogComponent の項目を「✅ 解決済み」に変更
- ThrottlerGuard の注意点を追加
- MailService の注意点を追加 (MailHog for dev)

### §9 次フェーズ候補の更新
- D-3, D-4, D-6, I-6, D-8, D-9 を削除（完了済み）
- 新候補を追加

### §11 コミット履歴に Phase 4-5 を追記

### §12 技術的負債
- ConfirmDialogComponent → 「✅ Phase 5 で解消」
- `.env` の `.gitignore` → 残存

## 対象ファイル
- `opshub/.agent/pm-handoff.md`
- `opshub/.agent/pm-prompt.md`

## 完了条件
- [ ] Phase 4-5 の完了が反映されている
- [ ] テスト件数が最新 (249/185)
- [ ] 次アクション候補が最新化
- [ ] 技術的負債リストが更新
- [ ] プロジェクト構造図が最新化
