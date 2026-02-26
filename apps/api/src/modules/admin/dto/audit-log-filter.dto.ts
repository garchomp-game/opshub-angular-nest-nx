import { IsOptional, IsString, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogFilterDto {
    @IsOptional()
    @IsString()
    action?: string;

    @IsOptional()
    @IsString()
    resourceType?: string;

    @IsOptional()
    @IsUUID()
    userId?: string;

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
