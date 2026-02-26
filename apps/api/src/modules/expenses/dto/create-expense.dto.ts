import { IsOptional, IsString, IsNumber, IsDateString, IsUUID, IsIn, Min, Max } from 'class-validator';
import { EXPENSE_CATEGORIES } from '@shared/types';

export class CreateExpenseDto {
    @IsIn(EXPENSE_CATEGORIES as unknown as string[])
    category: string;

    @IsNumber()
    @Min(1)
    @Max(10_000_000)
    amount: number;

    @IsDateString()
    expenseDate: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsUUID()
    projectId: string;

    @IsUUID()
    approverId: string;

    @IsOptional()
    @IsIn(['draft', 'submitted'])
    status?: string = 'draft';
}
