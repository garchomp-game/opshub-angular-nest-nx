import { IsOptional, IsIn, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryWorkflowDto {
    @ApiPropertyOptional({ description: 'ステータス', enum: ['draft', 'submitted', 'approved', 'rejected', 'withdrawn'] })
    @IsOptional()
    @IsIn(['draft', 'submitted', 'approved', 'rejected', 'withdrawn'])
    status?: string;

    @ApiPropertyOptional({ description: '申請タイプ', enum: ['expense', 'leave', 'purchase', 'other'] })
    @IsOptional()
    @IsIn(['expense', 'leave', 'purchase', 'other'])
    type?: string;

    @ApiPropertyOptional({ description: 'モード', enum: ['mine', 'pending'] })
    @IsOptional()
    @IsIn(['mine', 'pending'])
    mode?: string;

    @ApiPropertyOptional({ description: '開始日', example: '2026-01-01' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: '終了日', example: '2026-01-31' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

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
