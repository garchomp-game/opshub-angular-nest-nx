import { IsOptional, IsString, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExpenseSummaryQueryDto {
    @ApiProperty({ description: '開始日', example: '2026-01-01' })
    @IsDateString()
    dateFrom: string;

    @ApiProperty({ description: '終了日', example: '2026-01-31' })
    @IsDateString()
    dateTo: string;

    @ApiPropertyOptional({ description: '経費カテゴリ' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'プロジェクトID（UUID）' })
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @ApiPropertyOptional({ description: '承認済みのみ', default: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    approvedOnly?: boolean;
}
