import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Query,
    Body,
    Param,
    Header,
    HttpCode,
    HttpStatus,
    StreamableFile,
} from '@nestjs/common';
import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { BulkTimesheetDto } from './dto/bulk-timesheet.dto';
import {
    GetDailyTimesheetsQueryDto,
    GetWeeklyTimesheetsQueryDto,
    GetTimesheetSummaryQueryDto,
    ExportTimesheetsQueryDto,
} from './dto/query-timesheet.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';

@Controller('timesheets')
export class TimesheetsController {
    constructor(private readonly timesheetsService: TimesheetsService) { }

    @Get('daily')
    async getDaily(
        @CurrentUser() user: ICurrentUser,
        @Query() query: GetDailyTimesheetsQueryDto,
    ) {
        return this.timesheetsService.getDailyTimesheets(
            user.tenantId,
            user.id,
            query,
        );
    }

    @Get('weekly')
    async getWeekly(
        @CurrentUser() user: ICurrentUser,
        @Query() query: GetWeeklyTimesheetsQueryDto,
    ) {
        return this.timesheetsService.getWeeklyTimesheets(
            user.tenantId,
            user.id,
            query,
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: CreateTimesheetDto,
    ) {
        return this.timesheetsService.create(
            user.tenantId,
            user.id,
            dto,
        );
    }

    @Put('bulk')
    async bulkUpsert(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: BulkTimesheetDto,
    ) {
        return this.timesheetsService.bulkUpsert(
            user.tenantId,
            user.id,
            dto,
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        await this.timesheetsService.remove(user.tenantId, user.id, id);
    }

    @Get('summary/by-project')
    @Roles('pm', 'accounting', 'tenant_admin')
    async projectSummary(
        @CurrentUser() user: ICurrentUser,
        @Query() query: GetTimesheetSummaryQueryDto,
    ) {
        return this.timesheetsService.getProjectSummary(
            user.tenantId,
            query,
        );
    }

    @Get('summary/by-member')
    @Roles('pm', 'accounting', 'tenant_admin')
    async memberSummary(
        @CurrentUser() user: ICurrentUser,
        @Query() query: GetTimesheetSummaryQueryDto,
    ) {
        return this.timesheetsService.getUserSummary(
            user.tenantId,
            query,
        );
    }

    @Get('export')
    async exportCsv(
        @CurrentUser() user: ICurrentUser,
        @Query() query: ExportTimesheetsQueryDto,
    ) {
        const buffer = await this.timesheetsService.exportCsv(
            user.tenantId,
            query,
        );

        return new StreamableFile(buffer, {
            type: 'text/csv',
            disposition: 'attachment; filename="timesheets.csv"',
        });
    }
}
