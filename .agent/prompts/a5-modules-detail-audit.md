# A5: モジュール詳細 + シーケンス + エラー仕様 突き合わせ

## ゴール
旧ドキュメントのモジュール詳細設計・シーケンス図・エラー仕様と、現在の実装を突き合わせ、乖離をレポートする。

## 対象ドキュメント
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/detail/modules/` — モジュール詳細
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/detail/sequences/` — シーケンス図
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/detail/operations/` — オペレーション仕様
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/spec/errors/` — エラー仕様
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/spec/audit-logging/` — 監査ログ仕様
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/detail/testing/` — テスト仕様
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/detail/setup/` — セットアップ手順

## 対象実装
- `/home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/` — NestJS バックエンド
- `/home/garchomp-game/workspace/starlight-test/opshub/apps/web/src/` — Angular フロントエンド

## 調査項目
1. **モジュール構成**: ドキュメント記載のモジュール分割と実装のモジュール/フィーチャー構成が一致するか
2. **処理フロー**: シーケンス図の処理フローが実装のサービスメソッドチェーンと一致するか
3. **エラー定義**: ドキュメント記載のエラーコード・メッセージが実装に存在するか
4. **監査ログ**: ドキュメント記載の監査ログ出力箇所が実装されているか
5. **テスト方針**: ドキュメント記載のテスト方針と実際のテストファイル構成が一致するか
6. **セットアップ手順**: ドキュメント記載のセットアップ手順で実際に環境構築できるか

## 出力
`.agent/audit/a5-modules-detail-audit.md` にレポートを出力。

## 注意
- 差異の指摘のみ。修正はしない
