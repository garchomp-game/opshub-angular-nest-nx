import { IsIn } from 'class-validator';

export class UpdateInvoiceStatusDto {
    @IsIn(['draft', 'sent', 'paid', 'cancelled'])
    status: string;
}
