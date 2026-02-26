import { InvoiceStatus } from '../enums/invoice-status.enum';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: '下書き',
    [InvoiceStatus.SENT]: '送付済',
    [InvoiceStatus.PAID]: '入金済',
    [InvoiceStatus.CANCELLED]: 'キャンセル',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: '',
    [InvoiceStatus.SENT]: 'accent',
    [InvoiceStatus.PAID]: 'primary',
    [InvoiceStatus.CANCELLED]: 'warn',
};

export const DEFAULT_TAX_RATE = 0.10; // 10%
