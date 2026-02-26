import { IsOptional, IsIn, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryWorkflowDto {
    @IsOptional()
    @IsIn(['draft', 'submitted', 'approved', 'rejected', 'withdrawn'])
    status?: string;

    @IsOptional()
    @IsIn(['expense', 'leave', 'purchase', 'other'])
    type?: string;

    @IsOptional()
    @IsIn(['mine', 'pending'])
    mode?: string;

    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
