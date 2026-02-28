import {
    IsString,
    IsOptional,
    IsNumber,
    IsDateString,
    IsNotEmpty,
    IsUUID,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimesheetDto {
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
