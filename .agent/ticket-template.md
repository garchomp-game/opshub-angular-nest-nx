# チケットテンプレート (汎用)

## タイトル
[機能名/変更カテゴリ]: [簡潔な説明]

## 共通ルール
1. 対象ファイルのみ変更すること
2. 既存ロジック (Signal, Service, Router) は変更禁止
3. PrimeNG コンポーネントを直接使用
4. PrimeIcons (`pi pi-xxx`) を使用
5. サービスは `shared/services/` のみ利用可 (`ToastService`, `ModalService`)
6. 日本語 UI を維持
7. `data-testid` 属性を主要要素に付与
8. 完了後の検証:
   - `pnpm nx build web` (フロント変更時)
   - `pnpm nx build api` (API 変更時)
   - `pnpm nx test web` / `pnpm nx test api`
   - `npx playwright test` (E2E に影響する場合)

## 作業内容
[具体的な変更内容を箇条書きで記載]

## 対象ファイル

| パス | 変更内容 |
|---|---|
| `path/to/file.ts` | [NEW/MODIFY/DELETE] + 説明 |

## 検証手順
[ビルド/テスト/手動確認の手順]

## 参考
- PrimeNG 全 API: `.agent/llms-txt/primeNG-llms-full.txt`
- Swagger UI: `http://localhost:3000/api/docs` (開発モード)
- テストアカウント: `pm-handoff.md` セクション 3 参照
