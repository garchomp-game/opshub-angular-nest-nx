import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    Res,
    Req,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DocumentsService } from './documents.service';
import { QueryDocumentDto } from './dto/query-document.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../auth/types/auth.types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@shared/types';
import { FastifyFileInterceptor } from '../../common/interceptors/fastify-file.interceptor';

@ApiTags('documents')
@ApiBearerAuth()
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
    @UseInterceptors(new FastifyFileInterceptor('file'))
    async upload(
        @Param('projectId') projectId: string,
        @Req() req: FastifyRequest & { incomingFile?: any },
        @CurrentUser() user: AuthUser,
    ) {
        const file = req.incomingFile;
        if (!file) {
            throw new BadRequestException({
                code: 'ERR-VAL-F03',
                message: 'ファイルが指定されていません',
            });
        }

        // MIME タイプ検証
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
            throw new BadRequestException({
                code: 'ERR-VAL-F03',
                message: '許可されていないファイル形式です',
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
        @Res() reply: FastifyReply,
    ) {
        const { buffer, filename, mimeType } =
            await this.documentsService.getDownloadInfo(user.tenantIds[0], id);

        reply
            .header('Content-Type', mimeType)
            .header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
            .header('Content-Length', buffer.length)
            .send(buffer);
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
