import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInvoiceStatusDto {
    @ApiProperty({ description: '請求書ステータス', enum: ['draft', 'sent', 'paid', 'cancelled'] })
    @IsIn(['draft', 'sent', 'paid', 'cancelled'])
    status: string;
}
