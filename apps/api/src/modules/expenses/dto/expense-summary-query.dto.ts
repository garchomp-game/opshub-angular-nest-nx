import { IsOptional, IsString, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ExpenseSummaryQueryDto {
    @IsDateString()
    dateFrom: string;

    @IsDateString()
    dateTo: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsUUID()
    projectId?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    approvedOnly?: boolean;
}
