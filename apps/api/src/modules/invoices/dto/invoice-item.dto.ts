import { IsString, IsNotEmpty, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItemDto {
    @ApiProperty({ description: '明細説明' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: '数量', minimum: 0 })
    @IsNumber()
    @Min(0)
    quantity: number;

    @ApiProperty({ description: '単価', minimum: 0 })
    @IsNumber()
    @Min(0)
    unitPrice: number;

    @ApiPropertyOptional({ description: '並び順', minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
