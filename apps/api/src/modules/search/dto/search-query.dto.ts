import {
    IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min, Max, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
    @ApiProperty({ description: '検索キーワード', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    q!: string;

    @ApiPropertyOptional({ description: '検索カテゴリ', enum: ['all', 'workflows', 'projects', 'tasks', 'expenses'], default: 'all' })
    @IsOptional()
    @IsIn(['all', 'workflows', 'projects', 'tasks', 'expenses'])
    category?: string = 'all';

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
