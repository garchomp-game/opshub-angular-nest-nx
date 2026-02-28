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
 * 構造化ログエントリ
 */
interface StructuredLogEntry {
    timestamp: string;
    level: string;
    context: string;
    action: string;
    data?: unknown;
}

/**
 * 構造化ロガーサービス
 *
 * Usage:
 *   private logger = inject(LoggerService).createChild('AuthService');
 *   this.logger.info('loadFromStorage', { hasToken: true });
 *   // 本番: {"timestamp":"...","level":"INFO","context":"AuthService","action":"loadFromStorage","data":{"hasToken":true}}
 *   // 開発: [AuthService] INFO loadFromStorage { hasToken: true }
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
    private minLevel: LogLevel;
    private readonly devMode: boolean;

    constructor() {
        this.devMode = isDevMode();
        this.minLevel = this.devMode ? LogLevel.DEBUG : LogLevel.WARN;
    }

    /**
     * コンテキスト付きの子ロガーを生成する。
     * 各サービス/インターセプターで使用。
     */
    createChild(context: string): ContextLogger {
        return new ContextLogger(context, this.minLevel, this.devMode);
    }

    debug(context: string, action: string, data?: unknown): void {
        if (this.minLevel <= LogLevel.DEBUG) {
            this.emit('DEBUG', LogLevel.DEBUG, context, action, data);
        }
    }

    info(context: string, action: string, data?: unknown): void {
        if (this.minLevel <= LogLevel.INFO) {
            this.emit('INFO', LogLevel.INFO, context, action, data);
        }
    }

    warn(context: string, action: string, data?: unknown): void {
        if (this.minLevel <= LogLevel.WARN) {
            this.emit('WARN', LogLevel.WARN, context, action, data);
        }
    }

    error(context: string, action: string, data?: unknown): void {
        // ERROR は常に出力
        this.emit('ERROR', LogLevel.ERROR, context, action, data);
    }

    private emit(levelStr: string, level: LogLevel, context: string, action: string, data?: unknown): void {
        const entry: StructuredLogEntry = {
            timestamp: new Date().toISOString(),
            level: levelStr,
            context,
            action,
            ...(data !== undefined ? { data } : {}),
        };

        const consoleFn = level === LogLevel.ERROR ? console.error
            : level === LogLevel.WARN ? console.warn
                : level === LogLevel.INFO ? console.info
                    : console.debug;

        if (this.devMode) {
            // 開発時: 人間可読フォーマット
            const parts = [`[${context}]`, levelStr, action];
            if (data !== undefined) {
                consoleFn(...parts, data);
            } else {
                consoleFn(...parts);
            }
        } else {
            // 本番時: JSON 構造化出力
            consoleFn(JSON.stringify(entry));
        }
    }
}

/**
 * コンテキスト付きロガー
 *
 * LoggerService.createChild() で生成。
 * 開発時出力例: [AuthService] INFO loadFromStorage { hasToken: true }
 * 本番時出力例: {"timestamp":"...","level":"INFO","context":"AuthService","action":"loadFromStorage","data":{"hasToken":true}}
 */
export class ContextLogger {
    constructor(
        private readonly context: string,
        private readonly minLevel: LogLevel,
        private readonly devMode: boolean = true,
    ) { }

    debug(action: string, data?: unknown): void {
        if (this.minLevel <= LogLevel.DEBUG) {
            this.emit('DEBUG', LogLevel.DEBUG, action, data);
        }
    }

    info(action: string, data?: unknown): void {
        if (this.minLevel <= LogLevel.INFO) {
            this.emit('INFO', LogLevel.INFO, action, data);
        }
    }

    warn(action: string, data?: unknown): void {
        if (this.minLevel <= LogLevel.WARN) {
            this.emit('WARN', LogLevel.WARN, action, data);
        }
    }

    error(action: string, data?: unknown): void {
        this.emit('ERROR', LogLevel.ERROR, action, data);
    }

    private emit(levelStr: string, level: LogLevel, action: string, data?: unknown): void {
        const entry: StructuredLogEntry = {
            timestamp: new Date().toISOString(),
            level: levelStr,
            context: this.context,
            action,
            ...(data !== undefined ? { data } : {}),
        };

        const consoleFn = level === LogLevel.ERROR ? console.error
            : level === LogLevel.WARN ? console.warn
                : level === LogLevel.INFO ? console.info
                    : console.debug;

        if (this.devMode) {
            const parts = [`[${this.context}]`, levelStr, action];
            if (data !== undefined) {
                consoleFn(...parts, data);
            } else {
                consoleFn(...parts);
            }
        } else {
            consoleFn(JSON.stringify(entry));
        }
    }
}
