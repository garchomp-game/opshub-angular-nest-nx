import {
    IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsUUID,
    ValidateNested, ArrayMinSize, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemDto } from './invoice-item.dto';

export class CreateInvoiceDto {
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @IsString()
    @IsNotEmpty()
    clientName: string;

    @IsDateString()
    issuedDate: string;

    @IsDateString()
    dueDate: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    taxRate: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    @ArrayMinSize(1)
    items: InvoiceItemDto[];
}
