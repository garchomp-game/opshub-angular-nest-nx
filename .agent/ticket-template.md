# OpsHub 作業者向けプロンプトテンプレート (PrimeNG 版)

以下のテンプレートをコピーして `.agent/prompts/` に新しいチケットを作成します。

---

## テンプレート

```markdown
# T{番号}: {機能名} — {作業内容}

## プロジェクト情報
- Nx monorepo, Angular 21, PrimeNG 21 (Aura テーマ)
- パス: apps/web/src/app/features/{機能}/

## 対象ファイル
- `{ファイルパス1}`
- `{ファイルパス2}`

## 使用技術
- **PrimeNG 21** (Aura テーマ) — コンポーネントを直接 import して使用
- Tailwind CSS v4 (レイアウト用ユーティリティのみ: flex, grid, gap, p-*, m-* 等)
- Angular Signals (状態管理)
- ReactiveFormsModule (フォーム)

## PrimeNG コンポーネントリファレンス
- `.agent/llms-txt/primeNG-llms-full.txt` を参照
- 各コンポーネントは `import { XxxModule } from 'primeng/xxx'` で import
- スタイリングは PrimeNG デザイントークンを使用 (var(--p-xxx))

## 主要 PrimeNG コンポーネント対応表
| 用途 | PrimeNG | import |
|---|---|---|
| ボタン | `<p-button>` | `ButtonModule` from `primeng/button` |
| テーブル | `<p-table>` | `TableModule` from `primeng/table` |
| カード | `<p-card>` | `CardModule` from `primeng/card` |
| セレクト | `<p-select>` | `SelectModule` from `primeng/select` |
| テキスト入力 | `pInputText` | `InputTextModule` from `primeng/inputtext` |
| 数値入力 | `<p-inputnumber>` | `InputNumberModule` from `primeng/inputnumber` |
| テキストエリア | `pTextarea` | `TextareaModule` from `primeng/textarea` |
| 日付 | `<p-datepicker>` | `DatePickerModule` from `primeng/datepicker` |
| タグ/バッジ | `<p-tag>` | `TagModule` from `primeng/tag` |
| ページネータ | `<p-paginator>` | `PaginatorModule` from `primeng/paginator` |
| タブ | `<p-tabs>` | `TabsModule` from `primeng/tabs` |
| ダイアログ | `<p-dialog>` | `DialogModule` from `primeng/dialog` |
| アバター | `<p-avatar>` | `AvatarModule` from `primeng/avatar` |
| プログレスバー | `<p-progressbar>` | `ProgressBarModule` from `primeng/progressbar` |
| ツールチップ | `pTooltip` | `TooltipModule` from `primeng/tooltip` |
| パスワード | `<p-password>` | `PasswordModule` from `primeng/password` |
| メッセージ | `<p-message>` | `MessageModule` from `primeng/message` |
| ドロワー | `<p-drawer>` | `DrawerModule` from `primeng/drawer` |
| パンくず | `<p-breadcrumb>` | `BreadcrumbModule` from `primeng/breadcrumb` |
| メニュー | `<p-menu>` | `MenuModule` from `primeng/menu` |
| タイムライン | `<p-timeline>` | `TimelineModule` from `primeng/timeline` |
| スピナー | `<p-progressspinner>` | `ProgressSpinnerModule` from `primeng/progressspinner` |
| チャート | `<p-chart>` | `ChartModule` from `primeng/chart` |

## 共通ルール
1. **shared/ui は使用禁止** — PrimeNG コンポーネントを直接 import
2. Toast は `ToastService` (内部で PrimeNG MessageService を使用) を inject
3. 確認ダイアログは `ModalService` (内部で PrimeNG ConfirmationService を使用) を inject
4. `data-testid` 属性を主要要素に付与
5. 日本語 UI を維持
6. 既存ロジック (Signal, Service, Router) は変更禁止
7. 完了後: `pnpm nx build web` で確認
```

---

## 作業完了報告のフォーマット

作業者は完了時に以下を報告:

```
## 完了報告
- 変更ファイル: {リスト}
- ビルド結果: {pass/fail}
- 注意事項: {あれば}
```
