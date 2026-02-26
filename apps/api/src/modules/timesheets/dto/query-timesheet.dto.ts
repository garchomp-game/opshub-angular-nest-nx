import {
    IsOptional,
    IsDateString,
    IsUUID,
    IsArray,
    IsIn,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetDailyTimesheetsQueryDto {
    @IsDateString()
    workDate: string;

    @IsOptional()
    @IsUUID()
    userId?: string;
}

export class GetWeeklyTimesheetsQueryDto {
    @IsDateString()
    weekStart: string;

    @IsOptional()
    @IsUUID()
    userId?: string;
}

export class GetTimesheetSummaryQueryDto {
    @IsDateString()
    dateFrom: string;

    @IsDateString()
    dateTo: string;

    @IsOptional()
    @IsArray()
    @IsUUID(undefined, { each: true })
    projectIds?: string[];

    @IsOptional()
    @IsIn(['month', 'week', 'day'])
    unit?: string = 'month';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class ExportTimesheetsQueryDto {
    @IsDateString()
    dateFrom: string;

    @IsDateString()
    dateTo: string;

    @IsOptional()
    @IsUUID()
    projectId?: string;
}
