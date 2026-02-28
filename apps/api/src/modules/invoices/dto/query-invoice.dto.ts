import { IsOptional, IsString, IsIn, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInvoiceDto {
    @ApiPropertyOptional({ description: 'ステータス', enum: ['draft', 'sent', 'paid', 'cancelled'] })
    @IsOptional()
    @IsIn(['draft', 'sent', 'paid', 'cancelled'])
    status?: string;

    @ApiPropertyOptional({ description: 'クライアント名' })
    @IsOptional()
    @IsString()
    clientName?: string;

    @ApiPropertyOptional({ description: 'プロジェクトID（UUID）' })
    @IsOptional()
    @IsUUID()
    projectId?: string;

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
