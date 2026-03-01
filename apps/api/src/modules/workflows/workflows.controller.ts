import {
    Controller, Get, Post, Patch, Delete, Param, Body, Query,
    HttpCode, HttpStatus, UseInterceptors, UploadedFile,
    BadRequestException, StreamableFile, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { createReadStream } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { QueryWorkflowDto } from './dto/query-workflow.dto';
import { RejectWorkflowDto } from './dto/reject-workflow.dto';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@shared/types';

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
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        limits: { fileSize: MAX_FILE_SIZE_BYTES },
        fileFilter: (_req, file, cb) => {
            if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException({
                    code: 'ERR-WF-ATT-001',
                    message: `許可されていないファイル形式です: ${file.mimetype}`,
                }), false);
            }
        },
    }))
    uploadAttachment(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        if (!file) {
            throw new BadRequestException({
                code: 'ERR-WF-ATT-002',
                message: 'ファイルが指定されていません',
            });
        }
        return this.workflowsService.uploadAttachment(
            user.tenantId, id, file, user.id,
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
        @Res({ passthrough: true }) res: Response,
    ) {
        const attachment = await this.workflowsService.getAttachmentFile(
            user.tenantId, id, attachmentId,
        );

        const filePath = join(process.cwd(), attachment.storagePath);
        const stream = createReadStream(filePath);

        res.set({
            'Content-Type': attachment.contentType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        });

        return new StreamableFile(stream);
    }
}
