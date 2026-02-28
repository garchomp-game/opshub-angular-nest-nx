# A2: 画面仕様 + 要件定義 突き合わせ

## ゴール
旧ドキュメントの画面仕様書・要件定義と、現在のフロントエンド実装を突き合わせ、乖離をレポートする。

## 対象ドキュメント
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/requirements/` — 要件定義
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/requirements/screens/` — 画面一覧
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/spec/screens/` — 画面仕様
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/spec/ui-layout/` — UIレイアウト仕様
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/requirements/req-catalog/` — 要件カタログ

## 対象実装
`/home/garchomp-game/workspace/starlight-test/opshub/apps/web/src/app/` 配下の全コンポーネント

## 調査項目
1. **画面存在チェック**: ドキュメントに記載の各画面が実装に存在するか
2. **画面要素**: ドキュメント記載のフォーム・テーブル・ボタン等が実装に含まれるか
3. **ルーティング**: ドキュメント記載のURLパスと実装のルーティング設定が一致するか
4. **未ドキュメント画面**: 実装にあるがドキュメントに無い画面
5. **未実装画面**: ドキュメントにあるが実装に無い画面
6. **要件カタログの充足度**: req-catalog の各要件が実装でカバーされているか

## 出力
`.agent/audit/a2-screen-requirements-audit.md` にレポートを出力。

## 注意
- ドキュメントが古い可能性あり
- 差異の指摘のみ。修正はしない
