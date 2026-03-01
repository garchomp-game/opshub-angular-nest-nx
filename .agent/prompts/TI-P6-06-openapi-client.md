# TI-P6-06: OpenAPI クライアント自動生成 (Swagger → Angular SDK)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
NestJS の Swagger spec (`/api/docs-json`) から Angular 用 HTTP クライアントを自動生成する。
手動で書いている `HttpClient` の呼び出しをタイプセーフな生成コードに置き換える基盤を作る。

## 現状
- `@nestjs/swagger` v11.2.6 インストール済み
- Swagger UI: `http://localhost:3000/api/docs` (開発モードのみ)
- Swagger JSON: `http://localhost:3000/api/docs-json`
- Web 側の API 呼び出しは各 Service で `HttpClient` を直接使用

## 作業内容

### 1. openapi-generator-cli インストール
```bash
pnpm add -D @openapitools/openapi-generator-cli
```

### 2. 生成スクリプト作成
`package.json` の `scripts` に追加:
```json
{
  "generate:api-client": "pnpm nx serve api & sleep 5 && npx openapi-generator-cli generate -i http://localhost:3000/api/docs-json -g typescript-angular -o libs/api-client/src/lib --additional-properties=ngVersion=21,providedInRoot=true,fileNaming=kebab-case && kill %1"
}
```

**代替案（推奨）**: spec ファイルをエクスポートして静的に生成
```bash
# API 起動 → spec 取得 → 停止
curl http://localhost:3000/api/docs-json > libs/api-client/openapi.json
npx openapi-generator-cli generate \
  -i libs/api-client/openapi.json \
  -g typescript-angular \
  -o libs/api-client/src/lib \
  --additional-properties=ngVersion=21,providedInRoot=true,fileNaming=kebab-case
```

### 3. Nx ライブラリ作成
```bash
pnpm nx generate @nx/js:library api-client --directory=libs/api-client --importPath=@api-client --unitTestRunner=none
```

### 4. 生成設定ファイル
`openapitools.json` をルートに作成:
```json
{
  "$schema": "node_modules/@openapitools/openapi-generator-cli/config.schema.json",
  "spaces": 2,
  "generator-cli": {
    "version": "7.4.0"
  }
}
```

### 5. `.gitignore` に生成物追加
```
# OpenAPI 生成物
libs/api-client/src/lib/
!libs/api-client/src/lib/.gitkeep
```

### 6. ドキュメント
`README.md` または `libs/api-client/README.md` に使い方を記載:
- 生成コマンド
- import 方法
- 注意事項（自動生成ファイルは直接編集しないこと）

### 7. ビルド確認
```bash
pnpm nx build api
# API を起動して spec を取得
# 生成コマンド実行
# 生成ファイルの TypeScript エラーがないことを確認
```

## 参照ファイル
- `apps/api/src/main.ts` — Swagger 設定
- `package.json` — scripts セクション

## 注意事項
- 生成された SDK はあくまで**基盤**。既存の Web Service を置き換えるのは別チケットで実施
- 初回は「生成して動くことを確認」までがスコープ
- API サーバーが起動していないと spec が取得できない

## 完了条件
- [ ] `@openapitools/openapi-generator-cli` がインストールされている
- [ ] `libs/api-client/` が作成されている
- [ ] Swagger spec から Angular クライアントが生成できる
- [ ] 生成された TypeScript ファイルにコンパイルエラーがない
- [ ] 生成コマンドが `package.json` の scripts に登録されている
- [ ] 使い方ドキュメントが作成されている
