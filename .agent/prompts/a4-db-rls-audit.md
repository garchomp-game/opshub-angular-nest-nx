# A4: DB スキーマ + RLS + 認可 突き合わせ

## ゴール
旧ドキュメントの DB スキーマ定義・RLS (Row Level Security) ポリシー・認可ルールと、現在の実装を突き合わせ、乖離をレポートする。

## 対象ドキュメント
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/detail/db/` — DB スキーマ詳細
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/detail/rls/` — RLS ポリシー
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/spec/authz/` — 認可仕様
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/requirements/roles/` — ロール定義

## 対象実装
- `/home/garchomp-game/workspace/starlight-test/opshub/libs/prisma-db/` — Prisma スキーマ
- `/home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/` — NestJS バックエンド (ガード, ミドルウェア)

## 調査項目
1. **テーブル/モデル存在チェック**: ドキュメント記載のテーブルと Prisma スキーマのモデルが一致するか
2. **カラム/フィールド**: ドキュメント記載のカラム名・型と Prisma フィールドが一致するか
3. **RLS ポリシー**: ドキュメント記載の RLS ルールが Prisma ミドルウェアや NestJS ガードで実装されているか
4. **ロール定義**: ドキュメント記載のロールが実装の enum/型と一致するか
5. **リレーション**: ドキュメント記載のテーブル間関係と Prisma のリレーションが一致するか

## 出力
`.agent/audit/a4-db-rls-audit.md` にレポートを出力。

## 注意
- Supabase RLS → Prisma middleware への移行がある可能性
- 差異の指摘のみ。修正はしない
