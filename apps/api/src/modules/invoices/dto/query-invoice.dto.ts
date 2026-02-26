import { IsOptional, IsString, IsIn, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryInvoiceDto {
    @IsOptional()
    @IsIn(['draft', 'sent', 'paid', 'cancelled'])
    status?: string;

    @IsOptional()
    @IsString()
    clientName?: string;

    @IsOptional()
    @IsUUID()
    projectId?: string;

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
