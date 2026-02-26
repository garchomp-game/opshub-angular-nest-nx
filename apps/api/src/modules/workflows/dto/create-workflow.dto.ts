import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsNotEmpty, IsUUID, IsIn, MaxLength } from 'class-validator';

export class CreateWorkflowDto {
    @IsIn(['expense', 'leave', 'purchase', 'other'])
    type: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @IsNotEmpty()
    @IsUUID()
    approverId: string;

    @IsIn(['draft', 'submit'])
    action: 'draft' | 'submit';
}
