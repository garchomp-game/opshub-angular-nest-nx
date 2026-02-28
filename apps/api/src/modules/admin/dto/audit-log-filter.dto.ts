import { IsOptional, IsString, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogFilterDto {
    @ApiPropertyOptional({ description: 'アクション名' })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({ description: 'リソースタイプ' })
    @IsOptional()
    @IsString()
    resourceType?: string;

    @ApiPropertyOptional({ description: 'ユーザーID（UUID）' })
    @IsOptional()
    @IsUUID()
    userId?: string;

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
