# SEC-05: NestJS 追加セキュリティ強化 Walkthrough

## Changes Made

### 1. Body サイズ制限 (6.14) — 既に実装済み
`main.ts` に `json({ limit: '1mb' })` / `urlencoded({ limit: '1mb' })` が設定済みだったため、追加作業なし。

### 2. `node:` protocol imports (6.27) — 6 ファイル修正

| File | Changes |
|------|---------|
| [main.ts](file:///home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/main.ts) | `'fs'` → `'node:fs'` |
| [export.processor.ts](file:///home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/modules/admin/processors/export.processor.ts) | `'fs'` → `'node:fs'`, `'path'` → `'node:path'` |
| [workflows.controller.ts](file:///home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/modules/workflows/workflows.controller.ts) | `'path'` → `'node:path'`, `'fs'` → `'node:fs'`, `'crypto'` → `'node:crypto'` |
| [local-storage.service.ts](file:///home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/modules/documents/storage/local-storage.service.ts) | `'fs/promises'` → `'node:fs/promises'`, `'path'` → `'node:path'` |
| [auth.service.ts](file:///home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/modules/auth/auth.service.ts) | `'crypto'` → `'node:crypto'` |
| [export.processor.spec.ts](file:///home/garchomp-game/workspace/starlight-test/opshub/apps/api/src/modules/admin/tests/export.processor.spec.ts) | `'events'` → `'node:events'`, `jest.mock('fs')` → `jest.mock('node:fs')` |

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm nx build api` | ✅ webpack compiled successfully |
| `pnpm nx test api` | ✅ 32 suites, **270 tests passed** |
