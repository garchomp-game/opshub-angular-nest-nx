import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

@Controller('invoices')
@Roles('pm', 'accounting', 'tenant_admin')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    findAll(@CurrentUser() user: any, @Query() query: QueryInvoiceDto) {
        return this.invoicesService.findAll(user.tenantId, query);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.invoicesService.findOne(user.tenantId, id);
    }

    @Post()
    create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
        return this.invoicesService.create(user.tenantId, user.id, dto);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateInvoiceDto,
        @CurrentUser() user: any,
    ) {
        return this.invoicesService.update(user.tenantId, id, dto);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateInvoiceStatusDto,
        @CurrentUser() user: any,
    ) {
        return this.invoicesService.updateStatus(user.tenantId, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.invoicesService.remove(user.tenantId, id);
    }
}
