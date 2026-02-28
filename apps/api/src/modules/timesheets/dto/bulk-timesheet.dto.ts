import {
    IsString,
    IsOptional,
    IsNumber,
    IsDateString,
    IsNotEmpty,
    IsUUID,
    IsArray,
    ValidateNested,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkTimesheetEntryDto {
    @ApiPropertyOptional({ description: '既存レコードID（UUID）' })
    @IsOptional()
    @IsUUID()
    id?: string;

    @ApiProperty({ description: 'プロジェクトID（UUID）' })
    @IsNotEmpty()
    @IsUUID()
    projectId: string;

    @ApiPropertyOptional({ description: 'タスクID（UUID）' })
    @IsOptional()
    @IsUUID()
    taskId?: string;

    @ApiProperty({ description: '作業日', example: '2026-01-15' })
    @IsNotEmpty()
    @IsDateString()
    workDate: string;

    @ApiProperty({ description: '作業時間', minimum: 0.25, maximum: 24 })
    @IsNumber()
    @Min(0.25)
    @Max(24)
    hours: number;

    @ApiPropertyOptional({ description: 'メモ' })
    @IsOptional()
    @IsString()
    note?: string;
}

export class BulkTimesheetDto {
    @ApiProperty({ description: '工数エントリ一覧', type: [BulkTimesheetEntryDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkTimesheetEntryDto)
    entries: BulkTimesheetEntryDto[];

    @ApiPropertyOptional({ description: '削除対象ID一覧' })
    @IsOptional()
    @IsArray()
    @IsUUID(undefined, { each: true })
    deletedIds?: string[];
}
