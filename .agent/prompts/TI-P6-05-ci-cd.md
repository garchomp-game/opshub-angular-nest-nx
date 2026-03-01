# TI-P6-05: CI/CD パイプライン (GitHub Actions)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
GitHub Actions で CI パイプラインを構築する。
PR 作成時に lint + test + build を自動実行し、品質ゲートとする。

## 作業内容

### 1. `.github/workflows/ci.yml` を作成

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: opshub
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/opshub?schema=public
      JWT_SECRET: ci-test-jwt-secret
      JWT_REFRESH_SECRET: ci-test-jwt-refresh-secret
      SMTP_HOST: localhost
      SMTP_PORT: 1025
      MAIL_FROM: noreply@opshub.local
      APP_URL: http://localhost:4200

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: npx prisma generate --schema=libs/prisma-db/prisma/schema.prisma

      - name: Run Prisma Migrations
        run: npx prisma migrate deploy --schema=libs/prisma-db/prisma/schema.prisma

      - name: Build API
        run: pnpm nx build api

      - name: Build Web
        run: pnpm nx build web

      - name: Test API
        run: pnpm nx test api

      - name: Test Web
        run: pnpm nx test web
```

### 2. Nx キャッシュ最適化（任意）
GitHub Actions のキャッシュを使って Nx のキャッシュを永続化:
```yaml
      - uses: actions/cache@v4
        with:
          path: node_modules/.cache
          key: nx-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
```

### 3. バッジ追加（任意）
`README.md` に CI バッジを追加:
```markdown
![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)
```
※ リポジトリ名は実際のものに置き換え

### 4. `.github/.gitkeep` クリーンアップ
不要な `.gitkeep` があれば削除

## ローカル検証
CI ファイルの YAML 構文をチェック:
```bash
# actionlint がインストールされている場合
actionlint .github/workflows/ci.yml
```

## 完了条件
- [ ] `.github/workflows/ci.yml` が作成されている
- [ ] PostgreSQL service container が定義されている
- [ ] pnpm + Node.js 22 セットアップ
- [ ] Prisma generate + migrate + build + test の全ステップが含まれている
- [ ] YAML 構文エラーがないこと
