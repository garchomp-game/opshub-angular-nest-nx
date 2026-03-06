import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import { join } from 'node:path';

export interface WorkerResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Worker Thread を管理するサービス
 *
 * 重い処理（ZIP生成、大量データ変換など）をメインスレッドから
 * Worker Thread にオフロードしてパフォーマンスを維持する。
 */
@Injectable()
export class WorkerService {
    private readonly logger = new Logger(WorkerService.name);

    /**
     * Worker Thread でスクリプトを実行する
     *
     * @param workerPath ワーカースクリプトのパス（相対 or 絶対）
     * @param workerData ワーカーに渡すデータ
     * @returns 結果の Promise
     */
    run<T = any>(workerPath: string, workerData: Record<string, any>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const worker = new Worker(workerPath, {
                workerData,
            });

            worker.on('message', (result: WorkerResult<T>) => {
                if (result.success) {
                    resolve(result.data as T);
                } else {
                    reject(new Error(result.error ?? 'Worker failed'));
                }
            });

            worker.on('error', (err) => {
                this.logger.error(`Worker error: ${err.message}`, err.stack);
                reject(err);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }

    /**
     * ZIP生成ワーカーのショートカット
     */
    async generateZip(files: Array<{ name: string; content: string }>): Promise<Buffer> {
        const workerPath = join(__dirname, 'zip.worker.js');
        return this.run<Buffer>(workerPath, { files });
    }
}
