import { IsOptional, IsString, IsNumber, IsDateString, IsUUID, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EXPENSE_CATEGORIES } from '@shared/types';

export class CreateExpenseDto {
    @ApiProperty({ description: '経費カテゴリ' })
    @IsIn(EXPENSE_CATEGORIES as unknown as string[])
    category: string;

    @ApiProperty({ description: '金額', minimum: 1, maximum: 10000000 })
    @IsNumber()
    @Min(1)
    @Max(10_000_000)
    amount: number;

    @ApiProperty({ description: '経費発生日', example: '2026-01-15' })
    @IsDateString()
    expenseDate: string;

    @ApiPropertyOptional({ description: '説明' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'プロジェクトID（UUID）' })
    @IsUUID()
    projectId: string;

    @ApiProperty({ description: '承認者ID（UUID）' })
    @IsUUID()
    approverId: string;

    @ApiPropertyOptional({ description: 'ステータス', enum: ['draft', 'submitted'], default: 'draft' })
    @IsOptional()
    @IsIn(['draft', 'submitted'])
    status?: string = 'draft';
}
