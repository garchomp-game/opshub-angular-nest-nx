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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetDailyTimesheetsQueryDto {
    @ApiProperty({ description: '作業日', example: '2026-01-15' })
    @IsDateString()
    workDate: string;

    @ApiPropertyOptional({ description: 'ユーザーID（UUID）' })
    @IsOptional()
    @IsUUID()
    userId?: string;
}

export class GetWeeklyTimesheetsQueryDto {
    @ApiProperty({ description: '週の開始日（月曜日）', example: '2026-01-13' })
    @IsDateString()
    weekStart: string;

    @ApiPropertyOptional({ description: 'ユーザーID（UUID）' })
    @IsOptional()
    @IsUUID()
    userId?: string;
}

export class GetTimesheetSummaryQueryDto {
    @ApiProperty({ description: '開始日', example: '2026-01-01' })
    @IsDateString()
    dateFrom: string;

    @ApiProperty({ description: '終了日', example: '2026-01-31' })
    @IsDateString()
    dateTo: string;

    @ApiPropertyOptional({ description: 'プロジェクトID一覧' })
    @IsOptional()
    @IsArray()
    @IsUUID(undefined, { each: true })
    projectIds?: string[];

    @ApiPropertyOptional({ description: '集計単位', enum: ['month', 'week', 'day'], default: 'month' })
    @IsOptional()
    @IsIn(['month', 'week', 'day'])
    unit?: string = 'month';

    @ApiPropertyOptional({ description: 'ページ番号', minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: '1ページの件数', minimum: 1, maximum: 100, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class ExportTimesheetsQueryDto {
    @ApiProperty({ description: '開始日', example: '2026-01-01' })
    @IsDateString()
    dateFrom: string;

    @ApiProperty({ description: '終了日', example: '2026-01-31' })
    @IsDateString()
    dateTo: string;

    @ApiPropertyOptional({ description: 'プロジェクトID（UUID）' })
    @IsOptional()
    @IsUUID()
    projectId?: string;
}
