import {
    IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsUUID,
    ValidateNested, ArrayMinSize, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceItemDto } from './invoice-item.dto';

export class CreateInvoiceDto {
    @ApiPropertyOptional({ description: 'プロジェクトID（UUID）' })
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @ApiProperty({ description: 'クライアント名' })
    @IsString()
    @IsNotEmpty()
    clientName: string;

    @ApiProperty({ description: '発行日', example: '2026-01-15' })
    @IsDateString()
    issuedDate: string;

    @ApiProperty({ description: '支払期限', example: '2026-02-15' })
    @IsDateString()
    dueDate: string;

    @ApiProperty({ description: '税率（%）', minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    taxRate: number;

    @ApiPropertyOptional({ description: '備考' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ description: '請求明細', type: [InvoiceItemDto] })
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    @ArrayMinSize(1)
    items: InvoiceItemDto[];
}
