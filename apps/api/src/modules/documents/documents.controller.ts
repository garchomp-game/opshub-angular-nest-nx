import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    Res,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { QueryDocumentDto } from './dto/query-document.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../auth/types/auth.types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@shared/types';

@Controller()
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    /**
     * GET /api/projects/:projectId/documents — ドキュメント一覧取得
     */
    @Get('projects/:projectId/documents')
    @Roles('member', 'pm', 'tenant_admin')
    async findAll(
        @Param('projectId') projectId: string,
        @Query() query: QueryDocumentDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.documentsService.findAll(user.tenantIds[0], projectId, query);
    }

    /**
     * POST /api/projects/:projectId/documents — ファイルアップロード
     */
    @Post('projects/:projectId/documents')
    @Roles('pm', 'tenant_admin')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: MAX_FILE_SIZE_BYTES },
            fileFilter: (_req, file, cb) => {
                if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
                    cb(
                        new BadRequestException({
                            code: 'ERR-VAL-F03',
                            message: '許可されていないファイル形式です',
                        }),
                        false,
                    );
                    return;
                }
                cb(null, true);
            },
        }),
    )
    async upload(
        @Param('projectId') projectId: string,
        @UploadedFile() file: any, // Multer File
        @CurrentUser() user: AuthUser,
    ) {
        if (!file) {
            throw new BadRequestException({
                code: 'ERR-VAL-F03',
                message: 'ファイルが指定されていません',
            });
        }
        return this.documentsService.upload(
            user.tenantIds[0],
            projectId,
            user.id,
            file,
        );
    }

    /**
     * GET /api/documents/:id/download — ダウンロード
     */
    @Get('documents/:id/download')
    @Roles('member', 'pm', 'tenant_admin')
    async download(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
        @Res() res: Response,
    ) {
        const { buffer, filename, mimeType } =
            await this.documentsService.getDownloadInfo(user.tenantIds[0], id);

        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Length': buffer.length,
        });
        res.send(buffer);
    }

    /**
     * DELETE /api/documents/:id — ドキュメント削除
     */
    @Delete('documents/:id')
    @Roles('pm', 'tenant_admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
    ) {
        await this.documentsService.remove(user.tenantIds[0], id);
    }
}
