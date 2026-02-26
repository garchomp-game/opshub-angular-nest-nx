import {
    IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsUUID,
    ValidateNested, ArrayMinSize, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemDto } from './invoice-item.dto';

export class UpdateInvoiceDto {
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    clientName?: string;

    @IsOptional()
    @IsDateString()
    issuedDate?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    taxRate?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    @ArrayMinSize(1)
    items?: InvoiceItemDto[];
}
