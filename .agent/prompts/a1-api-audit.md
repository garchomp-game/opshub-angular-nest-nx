# A1: API仕様 突き合わせ

## ゴール
旧ドキュメントの API 仕様書と、現在の実装（NestJS バックエンド）を突き合わせ、乖離をレポートする。

## 対象ドキュメント
`/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/spec/apis/` 配下の全 .md ファイル

## 対象実装
`/home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/` 配下の全 controller, service, module

## 調査項目
1. **エンドポイント存在チェック**: ドキュメントに記載の各 API エンドポイント (メソッド + パス) が実装に存在するか
2. **リクエスト/レスポンス型**: ドキュメント記載の型と実装の DTO/型が一致しているか
3. **認可ルール**: ドキュメント記載のロール制限が実装のガードと一致しているか
4. **未ドキュメント API**: 実装にあるがドキュメントに無い API
5. **未実装 API**: ドキュメントにあるが実装に無い API

## 出力
`.agent/audit/a1-api-audit.md` にレポートを出力。以下フォーマット：
```
| API ID | エンドポイント | ドキュメント | 実装 | 差異 |
```

## 注意
- ドキュメントが古い可能性あり。実装が正の場合もある
- 差異の存在を指摘するだけでよい。修正はしない
