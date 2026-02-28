import { IsString, IsOptional, IsNumber, IsDateString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkflowDto {
    @ApiPropertyOptional({ description: 'タイトル', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

    @ApiPropertyOptional({ description: '説明', maxLength: 2000 })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({ description: '金額' })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional({ description: '開始日', example: '2026-01-01' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: '終了日', example: '2026-01-31' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({ description: '承認者ID（UUID）' })
    @IsOptional()
    @IsUUID()
    approverId?: string;
}
