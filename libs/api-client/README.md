# @api-client — 自動生成 API クライアント

NestJS Swagger spec から [ng-openapi-gen](https://github.com/cyclosproject/ng-openapi-gen) を使って自動生成された Angular HTTP クライアントライブラリ。

## 生成コマンド

### 1. API サーバー起動 & spec 取得

```bash
# API サーバーが起動している状態で:
pnpm generate:api-spec
```

### 2. Angular クライアント生成

```bash
pnpm generate:api-client
```

### ワンライナー（spec 取得 → 生成）

```bash
pnpm generate:api-spec && pnpm generate:api-client
```

## import 方法

```typescript
import { ApiConfiguration, Api } from '@api-client';

// ApiConfiguration の rootUrl を設定（デフォルト: ''）
// app.config.ts などで:
providers: [
  { provide: ApiConfiguration, useValue: { rootUrl: 'http://localhost:3000' } as ApiConfiguration },
]
```

### サービスの利用例

```typescript
import { Api } from '@api-client';
import { authControllerLogin } from '@api-client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(Api);

  async login(email: string, password: string) {
    return this.api.invoke(authControllerLogin, { body: { email, password } });
  }
}
```

## 注意事項

> **⚠️ 自動生成ファイルは直接編集しないでください**
>
> `libs/api-client/src/lib/` 配下のファイルはすべて自動生成されます。
> API の変更に追従するには、上記の生成コマンドを再実行してください。

- 生成元: `libs/api-client/openapi.json`（Swagger spec のスナップショット）
- 設定: `ng-openapi-gen.json`（プロジェクトルート）
- `.gitignore` で `libs/api-client/src/lib/` は除外済み（clone 後に要生成）
