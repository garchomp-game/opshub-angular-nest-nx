# PM プロンプト — Phase 5 完了後

## 現在の状態
- **最終コミット**: Phase 5 完了
- **UI ライブラリ**: PrimeNG 21 (Aura テーマ) — **移行完了**
- **DaisyUI / @ng-icons**: **完全撤去済み**

### 完了済みフェーズ

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | 全画面実装 (NestJS + Angular + Prisma) | ✅ |
| Phase 2 | PrimeNG 移行 (P1-P6) + DaisyUI 撤去 | ✅ |
| Phase 3 | コード品質 (C1-C5) | ✅ |
| Phase 4 | D-3 通知 / D-4 パスワードリセット / D-6 WF添付 | ✅ |
| Phase 5 | I-6 監査ログ / D-8 GIN / D-9 レート制限 / 技術的負債 | ✅ |

### Phase 3 完了タスク

| ID | 内容 | コミット |
|---|---|---|
| C1 | shared/ui 削除 → shared/services/ 移動 | `5af4f3b` |
| C2 | NestJS ValidationPipe + DTO/Swagger 導入 | `2de3ee0` |
| C3 | バンドル上限 2MB → 1.5MB | `af7918a` |
| C5 | ロギング・可観測性強化 (Web + API) | `2de3ee0` |

## テスト状態

| テスト | 件数 | 状態 |
|---|---|---|
| API ユニット (Jest)  | 249  | ✅ |
| Web ユニット (Vitest) | 185 | ✅ |
| E2E (Playwright) | 37 | ✅ |

## 重要ドキュメント
- `.agent/pm-handoff.md` — 包括的なプロジェクトナレッジ
- `.agent/prompts/` — チケットプロンプト (旧: t1-t8, v5-*, p1-p6 / 新: c2-c5)
- `.agent/llms-txt/primeNG-llms-full.txt` — PrimeNG 全 API ドキュメント

## 次のアクション (Phase 6 候補)

### 優先度中
- D-5: テナントデータエクスポート (GDPR)
- ドキュメント全面改訂 (reference/, opshub-doc/ — 旧アーキテクチャとの乖離解消) — 進行中

### 優先度低
- E2E テスト追加 (カバレッジ拡大)
- CI/CD パイプライン (GitHub Actions)

### 将来検討
- OpenAPI クライアント自動生成 (Angular SDK)
- Zod ベースのエンドツーエンド型安全
- BullMQ ジョブキュー (メール送信, レポート生成)
