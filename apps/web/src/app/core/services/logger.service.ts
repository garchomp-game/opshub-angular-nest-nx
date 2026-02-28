import { Injectable, isDevMode } from '@angular/core';

/**
 * ログレベル定義
 *
 * DEBUG < INFO < WARN < ERROR
 * 開発モード: DEBUG 以上すべて表示
 * 本番モード: WARN 以上のみ表示
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/**
 * 構造化ロガーサービス
 *
 * Usage:
 *   private logger = inject(LoggerService).createChild('AuthService');
 *   this.logger.debug('loadFromStorage: token exists', { hasToken: true });
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
    private minLevel: LogLevel;

    constructor() {
        this.minLevel = isDevMode() ? LogLevel.DEBUG : LogLevel.WARN;
    }

    /**
     * コンテキスト付きの子ロガーを生成する。
     * 各サービス/インターセプターで使用。
     */
    createChild(context: string): ContextLogger {
        return new ContextLogger(context, this.minLevel);
    }

    debug(message: string, ...data: unknown[]): void {
        if (this.minLevel <= LogLevel.DEBUG) {
            console.debug(`[OpsHub] ${message}`, ...data);
        }
    }

    info(message: string, ...data: unknown[]): void {
        if (this.minLevel <= LogLevel.INFO) {
            console.info(`[OpsHub] ${message}`, ...data);
        }
    }

    warn(message: string, ...data: unknown[]): void {
        if (this.minLevel <= LogLevel.WARN) {
            console.warn(`[OpsHub] ${message}`, ...data);
        }
    }

    error(message: string, ...data: unknown[]): void {
        // ERROR は常に出力
        console.error(`[OpsHub] ${message}`, ...data);
    }
}

/**
 * コンテキスト付きロガー
 *
 * LoggerService.createChild() で生成。
 * 出力例: [AuthService] loadFromStorage: token exists = true
 */
export class ContextLogger {
    constructor(
        private readonly context: string,
        private readonly minLevel: LogLevel,
    ) { }

    debug(message: string, ...data: unknown[]): void {
        if (this.minLevel <= LogLevel.DEBUG) {
            console.debug(`[${this.context}] ${message}`, ...data);
        }
    }

    info(message: string, ...data: unknown[]): void {
        if (this.minLevel <= LogLevel.INFO) {
            console.info(`[${this.context}] ${message}`, ...data);
        }
    }

    warn(message: string, ...data: unknown[]): void {
        if (this.minLevel <= LogLevel.WARN) {
            console.warn(`[${this.context}] ${message}`, ...data);
        }
    }

    error(message: string, ...data: unknown[]): void {
        console.error(`[${this.context}] ${message}`, ...data);
    }
}
