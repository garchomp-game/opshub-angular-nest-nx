import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProjectDto {
    @ApiPropertyOptional({ description: 'ステータス', enum: ['planning', 'active', 'completed', 'cancelled'] })
    @IsOptional()
    @IsIn(['planning', 'active', 'completed', 'cancelled'])
    status?: string;

    @ApiPropertyOptional({ description: '検索キーワード' })
    @IsOptional()
    @IsString()
    search?: string;

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
