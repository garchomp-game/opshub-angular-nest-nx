import {
    Controller, Get, Post, Patch, Delete, Param, Body, Query,
    HttpCode, HttpStatus, UseInterceptors, Req,
    BadRequestException, StreamableFile, Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { extname, join } from 'node:path';
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { QueryWorkflowDto } from './dto/query-workflow.dto';
import { RejectWorkflowDto } from './dto/reject-workflow.dto';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@shared/types';
import { FastifyFileInterceptor, FastifyMultipartFile } from '../../common/interceptors/fastify-file.interceptor';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'workflow-attachments');

@ApiTags('workflows')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowsController {
    constructor(private readonly workflowsService: WorkflowsService) { }

    @Get()
    findAll(@CurrentUser() user: any, @Query() query: QueryWorkflowDto) {
        return this.workflowsService.findAll(user.tenantId, user.id, query);
    }

    @Get('pending')
    @Roles('approver', 'tenant_admin')
    findPending(@CurrentUser() user: any) {
        return this.workflowsService.findPending(user.tenantId, user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.findOne(user.tenantId, id);
    }

    @Post()
    @Roles('member', 'pm', 'accounting', 'tenant_admin')
    create(@Body() dto: CreateWorkflowDto, @CurrentUser() user: any) {
        return this.workflowsService.create(user.tenantId, user.id, dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateWorkflowDto,
        @CurrentUser() user: any,
    ) {
        return this.workflowsService.update(user.tenantId, id, user.id, dto);
    }

    @Post(':id/submit')
    @HttpCode(HttpStatus.OK)
    submit(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.submit(user.tenantId, id, user.id);
    }

    @Post(':id/approve')
    @Roles('approver', 'tenant_admin')
    @HttpCode(HttpStatus.OK)
    approve(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.approve(user.tenantId, id, user.id);
    }

    @Post(':id/reject')
    @Roles('approver', 'tenant_admin')
    @HttpCode(HttpStatus.OK)
    reject(
        @Param('id') id: string,
        @Body() dto: RejectWorkflowDto,
        @CurrentUser() user: any,
    ) {
        return this.workflowsService.reject(user.tenantId, id, user.id, dto.reason);
    }

    @Post(':id/withdraw')
    @HttpCode(HttpStatus.OK)
    withdraw(@Param('id') id: string, @CurrentUser() user: any) {
        return this.workflowsService.withdraw(user.tenantId, id, user.id);
    }

    // ─── Attachment Endpoints ───

    @Post(':id/attachments')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(new FastifyFileInterceptor('file'))
    uploadAttachment(
        @Param('id') id: string,
        @Req() req: FastifyRequest & { incomingFile?: FastifyMultipartFile },
        @CurrentUser() user: any,
    ) {
        const file = req.incomingFile;
        if (!file) {
            throw new BadRequestException({
                code: 'ERR-WF-ATT-002',
                message: 'ファイルが指定されていません',
            });
        }

        // MIME type check
        if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
            throw new BadRequestException({
                code: 'ERR-WF-ATT-001',
                message: `許可されていないファイル形式です: ${file.mimetype}`,
            });
        }

        // Size check
        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException({
                code: 'ERR-WF-ATT-003',
                message: 'ファイルサイズが上限を超えています',
            });
        }

        // Save to disk (replaces Multer diskStorage)
        mkdirSync(UPLOAD_DIR, { recursive: true });
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        const filePath = join(UPLOAD_DIR, uniqueName);
        writeFileSync(filePath, file.buffer);

        // Create a Multer-compatible file object for the service
        const multerLikeFile = {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            filename: uniqueName,
            path: filePath,
            destination: UPLOAD_DIR,
            buffer: file.buffer,
        };

        return this.workflowsService.uploadAttachment(
            user.tenantId, id, multerLikeFile, user.id,
        );
    }

    @Get(':id/attachments')
    getAttachments(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.workflowsService.getAttachments(user.tenantId, id);
    }

    @Delete(':id/attachments/:attachmentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteAttachment(
        @Param('id') id: string,
        @Param('attachmentId') attachmentId: string,
        @CurrentUser() user: any,
    ) {
        return this.workflowsService.deleteAttachment(
            user.tenantId, id, attachmentId, user.id,
        );
    }

    @Get(':id/attachments/:attachmentId/download')
    async downloadAttachment(
        @Param('id') id: string,
        @Param('attachmentId') attachmentId: string,
        @CurrentUser() user: any,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        const attachment = await this.workflowsService.getAttachmentFile(
            user.tenantId, id, attachmentId,
        );

        const filePath = join(process.cwd(), attachment.storagePath);
        const stream = createReadStream(filePath);

        reply
            .header('Content-Type', attachment.contentType)
            .header('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);

        return new StreamableFile(stream);
    }
}
