import {
    IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsUUID,
    ValidateNested, ArrayMinSize, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceItemDto } from './invoice-item.dto';

export class UpdateInvoiceDto {
    @ApiPropertyOptional({ description: 'プロジェクトID（UUID）' })
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @ApiPropertyOptional({ description: 'クライアント名' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    clientName?: string;

    @ApiPropertyOptional({ description: '発行日', example: '2026-01-15' })
    @IsOptional()
    @IsDateString()
    issuedDate?: string;

    @ApiPropertyOptional({ description: '支払期限', example: '2026-02-15' })
    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @ApiPropertyOptional({ description: '税率（%）', minimum: 0, maximum: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    taxRate?: number;

    @ApiPropertyOptional({ description: '備考' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: '請求明細', type: [InvoiceItemDto] })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    @ArrayMinSize(1)
    items?: InvoiceItemDto[];
}
