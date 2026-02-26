import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@prisma-db';
import { StorageService } from './storage/storage.service';
import { QueryDocumentDto } from './dto/query-document.dto';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@shared/types';
import { v4 as uuid } from 'uuid';

@Injectable()
export class DocumentsService {
    private readonly logger = new Logger(DocumentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) { }

    /**
     * プロジェクト配下のドキュメント一覧取得（ページネーション付き）
     */
    async findAll(tenantId: string, projectId: string, query: QueryDocumentDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where = { tenantId, projectId };

        const [data, total] = await Promise.all([
            this.prisma.document.findMany({
                where,
                include: {
                    uploader: {
                        select: {
                            id: true,
                            profile: { select: { displayName: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.document.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * ファイルアップロード（MIME 検証 + Storage 保存 + DB INSERT）
     */
    async upload(
        tenantId: string,
        projectId: string,
        userId: string,
        file: any, // Multer File
    ) {
        // MIME タイプ検証
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
            throw new BadRequestException({
                code: 'ERR-VAL-F03',
                message: '許可されていないファイル形式です',
            });
        }

        // ファイルサイズ検証
        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException({
                code: 'ERR-VAL-F02',
                message: 'ファイルサイズが上限（10MB）を超えています',
            });
        }

        const storagePath = `${tenantId}/${projectId}/${uuid()}_${file.originalname}`;

        // 1. Storage にアップロード
        try {
            await this.storage.upload(storagePath, file.buffer, file.mimetype);
        } catch (error) {
            this.logger.error(`Storage upload failed: ${error}`);
            throw new InternalServerErrorException({
                code: 'ERR-SYS-F01',
                message: 'ファイルのアップロードに失敗しました',
            });
        }

        try {
            // 2. DB にレコード作成
            return await this.prisma.document.create({
                data: {
                    tenantId,
                    projectId,
                    uploadedBy: userId,
                    name: file.originalname,
                    filePath: storagePath,
                    fileSize: BigInt(file.size),
                    mimeType: file.mimetype,
                },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            profile: { select: { displayName: true } },
                        },
                    },
                },
            });
        } catch (error) {
            // 3. DB 失敗時は Storage を削除（ロールバック）
            await this.storage.delete(storagePath).catch(() => { });
            throw error;
        }
    }

    /**
     * ダウンロード情報取得（バッファ + ファイル名 + MIME タイプ）
     */
    async getDownloadInfo(tenantId: string, id: string) {
        const doc = await this.prisma.document.findFirst({
            where: { id, tenantId },
        });

        if (!doc) {
            throw new NotFoundException({
                code: 'ERR-DOC-001',
                message: 'ドキュメントが見つかりません',
            });
        }

        const buffer = await this.storage.download(doc.filePath);

        return {
            buffer,
            filename: doc.name,
            mimeType: doc.mimeType,
        };
    }

    /**
     * ドキュメント削除（Storage ファイル + DB レコード）
     */
    async remove(tenantId: string, id: string) {
        const doc = await this.prisma.document.findFirst({
            where: { id, tenantId },
        });

        if (!doc) {
            throw new NotFoundException({
                code: 'ERR-DOC-001',
                message: 'ドキュメントが見つかりません',
            });
        }

        // Storage 削除
        try {
            await this.storage.delete(doc.filePath);
        } catch (error) {
            this.logger.error(`Storage delete failed: ${error}`);
            throw new InternalServerErrorException({
                code: 'ERR-SYS-F02',
                message: 'ファイルの削除に失敗しました',
            });
        }

        // DB 削除
        await this.prisma.document.delete({ where: { id } });
    }
}
