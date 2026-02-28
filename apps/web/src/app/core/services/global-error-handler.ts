import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from './logger.service';

/**
 * グローバルエラーハンドラー
 *
 * Angular のデフォルト ErrorHandler を置換し、全未キャッチエラーを構造化ログに記録する。
 * - NG0200 等の Angular フレームワークエラーを確実に捕捉
 * - HttpErrorResponse は HTTP インターセプターが処理するため分類のみ
 * - 将来: Sentry 等の外部サービスへの送信フックを追加可能
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private logger = inject(LoggerService).createChild('GlobalErrorHandler');

    handleError(error: unknown): void {
        // HttpErrorResponse はインターセプターが処理済み → warn レベルで記録
        if (error instanceof HttpErrorResponse) {
            this.logger.warn('HTTP error (handled by interceptor)', {
                status: error.status,
                url: error.url,
                message: error.message,
            });
            return;
        }

        // Angular フレームワークエラー (NG0200 等)
        const ngError = this.extractNgError(error);
        if (ngError) {
            this.logger.error(`Angular framework error: ${ngError.code}`, {
                code: ngError.code,
                message: ngError.message,
                stack: ngError.stack,
            });
            // デフォルトのコンソール出力も維持（開発者が見逃さないように）
            console.error(error);
            return;
        }

        // その他の未キャッチエラー
        if (error instanceof Error) {
            this.logger.error(`Uncaught error: ${error.message}`, {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
        } else {
            this.logger.error('Uncaught non-Error object thrown', { error });
        }

        // デフォルトのコンソール出力も維持
        console.error(error);
    }

    /**
     * Angular の NG エラーコード (NG0200, NG0100 等) を抽出する
     */
    private extractNgError(error: unknown): { code: string; message: string; stack?: string } | null {
        if (!(error instanceof Error)) return null;

        const match = error.message.match(/NG(\d{4})/);
        if (match) {
            return {
                code: `NG${match[1]}`,
                message: error.message,
                stack: error.stack,
            };
        }
        return null;
    }
}
