import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from './storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageService extends StorageService {
    private readonly logger = new Logger(LocalStorageService.name);
    private readonly basePath = path.resolve(process.cwd(), 'uploads');

    async upload(filePath: string, file: Buffer, _contentType: string): Promise<void> {
        const fullPath = path.join(this.basePath, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, file);
        this.logger.log(`File uploaded: ${filePath}`);
    }

    async download(filePath: string): Promise<Buffer> {
        const fullPath = path.join(this.basePath, filePath);
        return fs.readFile(fullPath);
    }

    async getSignedUrl(filePath: string, _expiresIn: number): Promise<string> {
        // ローカル開発用: 直接ダウンロード URL を返す（署名なし）
        return `/api/documents/file/${encodeURIComponent(filePath)}`;
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = path.join(this.basePath, filePath);
        try {
            await fs.unlink(fullPath);
            this.logger.log(`File deleted: ${filePath}`);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            this.logger.warn(`File not found for deletion: ${filePath}`);
        }
    }
}
