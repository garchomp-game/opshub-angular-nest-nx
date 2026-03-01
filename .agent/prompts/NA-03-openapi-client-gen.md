# NA-03: OpenAPI → Angular SDK 自動生成パイプライン

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
現在のフロントエンドでは `HttpClient` を直接使用して API を呼び出している。
`@nestjs/swagger` で生成される OpenAPI spec から Angular 用の型安全な SDK を自動生成し、
手動の `HttpClient` 呼び出しを置き換えるパイプラインを構築する。

## 前提条件
- `@nestjs/swagger` がインストール済み（TI-DOC-01 で確認済み）
- Swagger UI が `http://localhost:3000/api/docs` で利用可能

## 作業内容

### 1. OpenAPI JSON エクスポート

```typescript
// apps/api/src/main.ts — Swagger 設定後に追加
import * as fs from 'fs';

if (process.env['GENERATE_OPENAPI'] === 'true') {
    const doc = SwaggerModule.createDocument(app, config);
    fs.writeFileSync('openapi.json', JSON.stringify(doc, null, 2));
    console.log('OpenAPI spec written to openapi.json');
    process.exit(0);
}
```

### 2. openapi-generator-cli のセットアップ

```bash
pnpm add -D @openapitools/openapi-generator-cli
```

### 3. 生成スクリプト

```json
// package.json scripts
{
    "generate:openapi-spec": "GENERATE_OPENAPI=true pnpm nx serve api --watch=false",
    "generate:api-client": "pnpm generate:openapi-spec && npx openapi-generator-cli generate -g typescript-angular -i openapi.json -o libs/api-client/src/generated --additional-properties=ngVersion=19"
}
```

### 4. libs/api-client/ ライブラリ

- [ ] `libs/api-client/` に生成コードを配置
- [ ] `tsconfig.base.json` の paths に `@opshub/api-client` を追加
- [ ] `.gitignore` に `libs/api-client/src/generated/` を追加（毎回再生成のため）
- [ ] 動作確認: `import { WorkflowsService } from '@opshub/api-client'` がコンパイルできること

### 5. CI 統合（任意）

```yaml
# .github/workflows/ci.yml に追加
- name: Generate API Client
  run: pnpm generate:api-client
- name: Check for Stale Client
  run: git diff --exit-code libs/api-client/
```

## 対象ファイル

| パス | 変更内容 |
|------|---------|
| `apps/api/src/main.ts` | MODIFY: OpenAPI JSON 出力設定 |
| `package.json` | MODIFY: generate スクリプト追加 |
| `libs/api-client/` | NEW: 生成された Angular SDK |
| `tsconfig.base.json` | MODIFY: paths 追加 |
| `.gitignore` | MODIFY: generated/ パターン追加 |

## 完了条件
- [ ] `pnpm generate:api-client` で Angular SDK が生成される
- [ ] 生成された SDK がコンパイルエラーなしでビルドできる
- [ ] `pnpm nx build web` PASS
- [ ] `pnpm nx test web` PASS
