import { IsString, IsNotEmpty, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class InvoiceItemDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Min(0)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
