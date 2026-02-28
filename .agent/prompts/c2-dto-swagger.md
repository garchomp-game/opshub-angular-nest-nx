# C2: NestJS ValidationPipe + DTO 強化

## 共通ルール
- `.agent/prompts/p0-common-rules.md` を参照
- 既存ロジック / テストを壊さない
- 完了後 `pnpm nx build api && pnpm nx test api` で確認

## 作業内容

### 1. ValidationPipe 強化 (`apps/api/src/main.ts`)

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### 2. `@nestjs/swagger` 導入

```bash
pnpm add @nestjs/swagger
```

`main.ts` に Swagger 設定追加 (開発モードのみ):

```ts
if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('OpsHub API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);
}
```

### 3. 全コントローラに `@ApiTags` 追加

対象: `apps/api/src/modules/` 配下の全 `.controller.ts`

```ts
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('workflows')
@ApiBearerAuth()
@Controller('workflows')
```

### 4. 既存 DTO に `class-validator` デコレータ追加

対象: `apps/api/src/modules/` 配下の全 `*.dto.ts`

既に `class-validator` がインストール済みか確認し、未インストールなら追加:
```bash
pnpm add class-validator class-transformer
```

各 DTO のプロパティに適切なデコレータを付与:
```ts
import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowDto {
  @ApiProperty({ description: '申請タイプ' })
  @IsString()
  @IsEnum(WorkflowType)
  type: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
```

### 5. 検証

- `pnpm nx build api` — ビルド成功
- `pnpm nx test api` — 229 テスト通過
- `pnpm nx serve api` → `http://localhost:3000/api/docs` でSwagger UI表示確認
- `npx playwright test` — E2E 37 テスト通過

## 対象ファイル

| パス | 変更 |
|---|---|
| `apps/api/src/main.ts` | ValidationPipe + Swagger 設定 |
| `apps/api/src/modules/*/**.controller.ts` | @ApiTags, @ApiBearerAuth |
| `apps/api/src/modules/*/dto/*.dto.ts` | class-validator + @ApiProperty |
| `package.json` | @nestjs/swagger 追加 |
