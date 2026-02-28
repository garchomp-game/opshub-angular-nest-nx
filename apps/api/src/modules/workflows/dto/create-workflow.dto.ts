import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsNotEmpty, IsUUID, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowDto {
    @ApiProperty({ description: '申請タイプ', enum: ['expense', 'leave', 'purchase', 'other'] })
    @IsIn(['expense', 'leave', 'purchase', 'other'])
    type: string;

    @ApiProperty({ description: 'タイトル', maxLength: 100 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    title: string;

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

    @ApiProperty({ description: '承認者ID（UUID）' })
    @IsNotEmpty()
    @IsUUID()
    approverId: string;

    @ApiProperty({ description: 'アクション', enum: ['draft', 'submit'] })
    @IsIn(['draft', 'submit'])
    action: 'draft' | 'submit';
}
