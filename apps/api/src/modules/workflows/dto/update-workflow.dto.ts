import { IsString, IsOptional, IsNumber, IsDateString, IsUUID, MaxLength } from 'class-validator';

export class UpdateWorkflowDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

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

    @IsOptional()
    @IsUUID()
    approverId?: string;
}
