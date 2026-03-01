# TI-P7-01: D-5 テナントデータエクスポート (GDPR 対応)

## 共通ルール
// turbo-all
- `pnpm`, `npx`, `nx` 等のコマンドは自由に実行してよい
- `sudo` が必要な操作やシステム設定変更のみユーザーに確認

## 概要
テナント管理者が自テナントの全データを JSON / CSV 形式でエクスポートできる機能を実装する。
GDPR のデータポータビリティ要件に対応し、BullMQ を使った非同期ジョブで大量データにも耐える設計とする。

## ドキュメント仕様 (apis.md)

### エンドポイント
| Method | Path | 説明 | ロール | レスポンス |
|---|---|---|---|---|
| POST | `/api/tenants/me/export` | データエクスポート | tenant_admin, it_admin | 202: ExportJob |
| GET | `/api/tenants/me/export/:jobId` | エクスポート状態確認 | tenant_admin, it_admin | 200: ExportJobStatus |
| GET | `/api/tenants/me/export/:jobId/download` | エクスポートファイルDL | tenant_admin, it_admin | 200: file |

### ExportTenantDto
```typescript
class ExportTenantDto {
  @IsIn(['json', 'csv'])
  format: 'json' | 'csv';

  @IsArray()
  @IsIn(['users', 'projects', 'workflows', 'timesheets', 'expenses'], { each: true })
  include: string[];
}
```

### 監査ログ
| 操作 | action | resourceType |
|---|---|---|
| データエクスポート | `tenant.export` | `tenant` |

## 作業内容

### 1. ExportTenantDto 作成
ファイル: `apps/api/src/modules/admin/dto/export-tenant.dto.ts` [NEW]

```typescript
import { IsIn, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const EXPORTABLE_TABLES = ['users', 'projects', 'workflows', 'timesheets', 'expenses'] as const;

export class ExportTenantDto {
  @ApiProperty({ enum: ['json', 'csv'] })
  @IsIn(['json', 'csv'])
  format: 'json' | 'csv';

  @ApiProperty({ enum: EXPORTABLE_TABLES, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(EXPORTABLE_TABLES, { each: true })
  include: (typeof EXPORTABLE_TABLES[number])[];
}
```

### 2. ExportService 作成
ファイル: `apps/api/src/modules/admin/services/export.service.ts` [NEW]

責務:
- `requestExport(tenantId, dto)` → BullMQ にジョブ投入、jobId を返す
- `getExportStatus(jobId)` → ジョブの状態 (queued/processing/completed/failed) を返す
- `getExportFile(jobId)` → 完了済みエクスポートファイルのパスを返す

### 3. ExportProcessor (Worker) 作成
ファイル: `apps/api/src/modules/admin/processors/export.processor.ts` [NEW]

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('tenant-export')
export class ExportProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) { super(); }

  async process(job: Job<{ tenantId: string; format: 'json' | 'csv'; include: string[] }>): Promise<string> {
    const { tenantId, format, include } = job.data;
    const exportDir = `exports/${tenantId}`;

    // fs.mkdirSync(exportDir, { recursive: true })

    const data: Record<string, any[]> = {};

    // 各テーブルのデータ取得
    for (const table of include) {
      await job.updateProgress(Math.round((include.indexOf(table) / include.length) * 100));
      data[table] = await this.fetchTableData(tenantId, table);
    }

    // ファイル生成
    if (format === 'json') {
      // JSON: 1ファイルに全テーブル
      const filePath = `${exportDir}/export-${job.id}.json`;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return filePath;
    } else {
      // CSV: テーブルごとにファイル → ZIPで圧縮
      // archiver パッケージを使用
      const zipPath = `${exportDir}/export-${job.id}.zip`;
      // ... ZIP 作成
      return zipPath;
    }
  }

  private async fetchTableData(tenantId: string, table: string): Promise<any[]> {
    switch (table) {
      case 'users':
        return this.prisma.userRole.findMany({
          where: { tenantId },
          include: { user: { select: { id: true, email: true, profile: true } } },
        });
      case 'projects':
        return this.prisma.project.findMany({ where: { tenantId } });
      case 'workflows':
        return this.prisma.workflow.findMany({ where: { tenantId } });
      case 'timesheets':
        return this.prisma.timesheet.findMany({ where: { tenantId } });
      case 'expenses':
        return this.prisma.expense.findMany({ where: { tenantId } });
      default:
        return [];
    }
  }
}
```

### 4. TenantsController にエンドポイント追加
ファイル: `apps/api/src/modules/admin/controllers/tenants.controller.ts`

```typescript
@Post('export')
@HttpCode(HttpStatus.ACCEPTED)
@Roles('tenant_admin', 'it_admin')
async exportData(@CurrentUser() user: JwtPayload, @Body() dto: ExportTenantDto) {
  const job = await this.exportService.requestExport(user.tenantId, dto);
  return { jobId: job.id, status: 'queued' };
}

@Get('export/:jobId')
@Roles('tenant_admin', 'it_admin')
async getExportStatus(@Param('jobId') jobId: string) {
  return this.exportService.getExportStatus(jobId);
}

@Get('export/:jobId/download')
@Roles('tenant_admin', 'it_admin')
async downloadExport(@Param('jobId') jobId: string, @Res() res: Response) {
  const filePath = await this.exportService.getExportFile(jobId);
  res.download(filePath);
}
```

### 5. AdminModule にエクスポート関連を登録
ファイル: `apps/api/src/modules/admin/admin.module.ts`

```typescript
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'tenant-export' }),
  ],
  controllers: [TenantsController, UsersController, AuditLogsController],
  providers: [TenantsService, UsersService, AuditLogsService, ExportService, ExportProcessor],
})
```

### 6. archiver パッケージインストール (CSV ZIP 用)
```bash
pnpm add archiver
pnpm add -D @types/archiver
```

### 7. .gitignore にエクスポートディレクトリ追加
```
exports/
```

### 8. Web 側 UI (テナント設定画面)
ファイル: `apps/web/src/app/features/admin/tenant/tenant-settings.component.ts`

テナント設定画面にエクスポートセクションを追加:
- フォーマット選択 (JSON / CSV) — PrimeNG `SelectButton` or `RadioButton`
- データ選択 (チェックボックス: ユーザー/プロジェクト/WF/工数/経費) — PrimeNG `Checkbox`
- エクスポートボタン — PrimeNG `Button`
- 進捗表示 — PrimeNG `ProgressBar` (ジョブ進捗をポーリング)
- ダウンロードリンク — 完了後に表示

Web Service:
ファイル: `apps/web/src/app/features/admin/services/tenant.service.ts` に追加:
```typescript
exportData(dto: ExportTenantDto): Observable<{ jobId: string }> {
  return this.http.post<any>('/api/admin/tenant/export', dto);
}
getExportStatus(jobId: string): Observable<ExportJobStatus> {
  return this.http.get<any>(`/api/admin/tenant/export/${jobId}`);
}
downloadExport(jobId: string): void {
  window.open(`/api/admin/tenant/export/${jobId}/download`);
}
```

### 9. テスト
- `export.service.spec.ts` [NEW] — Queue モック、正常/異常系
- `export.processor.spec.ts` [NEW] — Prisma モック、JSON/CSV 出力検証
- `tenants.controller.spec.ts` — export エンドポイント追加分のテスト
- `tenant-settings.component.spec.ts` — エクスポート UI のテスト

### 10. ビルド・テスト確認
```bash
pnpm nx build api
pnpm nx build web
pnpm nx test api
pnpm nx test web
```

## 参照ファイル
- `nx-angular-nestjs-doc/src/content/docs/spec/apis.md` L80-201 — テナント API 仕様
- `nx-angular-nestjs-doc/src/content/docs/detail/modules/admin.md` — admin モジュール設計
- `apps/api/src/modules/admin/` — 既存 admin モジュール
- `apps/api/src/modules/mail/mail.processor.ts` — BullMQ Worker の実装例
- `apps/web/src/app/features/admin/` — 既存 admin Web 画面

## 完了条件
- [ ] `ExportTenantDto` が作成されている (format + include)
- [ ] `ExportService` が BullMQ ジョブ投入・状態確認・ファイル取得を実装
- [ ] `ExportProcessor` が JSON/CSV データ抽出 + ファイル生成を実装
- [ ] TenantsController に POST/GET/GET(download) の3エンドポイント追加
- [ ] CSV エクスポート時に ZIP 圧縮される
- [ ] エクスポートジョブの進捗が取得できる
- [ ] Web UI でフォーマット・テーブル選択 → エクスポート → ダウンロードの一連の操作が可能
- [ ] 監査ログに `tenant.export` が記録される
- [ ] テストが作成され全パスする
- [ ] `pnpm nx build api && pnpm nx build web` 成功
