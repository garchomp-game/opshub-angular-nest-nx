# A3: アーキテクチャ + ADR 突き合わせ

## ゴール
旧ドキュメントのアーキテクチャ設計書・ADR (Architecture Decision Record) が現在の実装と整合しているか調査する。

## 対象ドキュメント
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/architecture/` (3 files)
  - `tech-stack.md` — 技術スタック定義
  - `directory-structure.md` — ディレクトリ構成
  - `supabase.md` — Supabase アーキテクチャ
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/adr/` (6 ADRs)
- `/home/garchomp-game/workspace/starlight-test/opsHub-doc/src/content/docs/spec/architecture/` — 追加アーキテクチャ仕様

## 対象実装
- `/home/garchomp-game/workspace/starlight-test/opshub/` — プロジェクト全体
- `package.json` — 依存関係
- `nx.json`, `project.json` — ビルド設定

## 調査項目
1. **技術スタック**: ドキュメント記載の技術スタック (フレームワーク, DB, 認証等) が実装と一致するか
   - 特に: NG-ZORRO → DaisyUI 移行後の記載更新漏れ
   - Supabase vs Prisma — どちらを使っているか
2. **ディレクトリ構成**: ドキュメント記載の構成と実際のディレクトリが一致するか
3. **ADR の有効性**: 各 ADR の決定事項が現在の実装に反映されているか
4. **陳腐化した ADR**: 実装が ADR の方針から逸脱している箇所

## 出力
`.agent/audit/a3-architecture-adr-audit.md` にレポートを出力。

## 注意
- 技術スタック変更 (NG-ZORRO → DaisyUI v5, Tailwind v3 → v4) は既知の変更
- Supabase → Prisma 移行の可能性にも注目
- 差異の指摘のみ。修正はしない
