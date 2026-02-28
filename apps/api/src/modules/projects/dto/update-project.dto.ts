import {
    IsString, IsOptional, IsDateString, IsIn, MaxLength, IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
    @ApiPropertyOptional({ description: 'プロジェクト名', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ description: '説明' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'ステータス', enum: ['planning', 'active', 'completed', 'cancelled'] })
    @IsOptional()
    @IsIn(['planning', 'active', 'completed', 'cancelled'])
    status?: string;

    @ApiPropertyOptional({ description: '開始日', example: '2026-01-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: '終了日', example: '2026-12-31' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'PM（プロジェクトマネージャー）ID（UUID）' })
    @IsOptional()
    @IsUUID()
    pmId?: string;
}
