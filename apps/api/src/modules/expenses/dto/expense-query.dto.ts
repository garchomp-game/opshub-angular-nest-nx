import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExpenseQueryDto {
    @ApiPropertyOptional({ description: '経費カテゴリ' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'ステータス', enum: ['draft', 'submitted', 'approved', 'rejected'] })
    @IsOptional()
    @IsIn(['draft', 'submitted', 'approved', 'rejected'])
    status?: string;

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
