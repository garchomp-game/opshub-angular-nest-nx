import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export interface FastifyMultipartFile {
    fieldname: string;
    filename: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    originalname: string;
}

/**
 * Fastify Multipart ファイルインターセプター
 *
 * @nestjs/platform-express の FileInterceptor と同等の機能を Fastify 環境で提供する。
 * リクエストオブジェクトに `file` プロパティを付与し、
 * Multer 互換のインターフェースで後続のハンドラに渡す。
 */
@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
    constructor(private readonly fieldName: string) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        try {
            const data = await request.file();

            if (data) {
                const buffer = await data.toBuffer();
                const file: FastifyMultipartFile = {
                    fieldname: data.fieldname ?? this.fieldName,
                    filename: data.filename,
                    encoding: data.encoding,
                    mimetype: data.mimetype,
                    buffer,
                    size: buffer.length,
                    originalname: data.filename,
                };
                request.file = file;
                request.incomingFile = file;
            }
        } catch (error) {
            throw new BadRequestException({
                code: 'ERR-VAL-F01',
                message: 'ファイルの解析に失敗しました',
            });
        }

        return next.handle();
    }
}

/**
 * ファクトリ関数: FileInterceptor('field') と同じ書き方で使えるようにする
 *
 * @example
 * @UseInterceptors(FileUpload('file'))
 */
export function FileUpload(fieldName: string) {
    return new FastifyFileInterceptor(fieldName);
}
