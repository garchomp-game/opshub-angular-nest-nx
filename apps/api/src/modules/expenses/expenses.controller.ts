import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { ExpenseSummaryQueryDto } from './dto/expense-summary-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser as ICurrentUser } from '@shared/types';

@Controller('expenses')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) { }

    // ─── CRUD ───

    @Get()
    async findAll(
        @CurrentUser() user: ICurrentUser,
        @Query() query: ExpenseQueryDto,
    ) {
        return this.expensesService.findAll(user.tenantId, user.id, query);
    }

    @Get(':id')
    async findOne(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        return this.expensesService.findOne(user.tenantId, id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: CreateExpenseDto,
    ) {
        return this.expensesService.create(user.tenantId, user.id, dto);
    }

    // ─── Summary (要権限) ───

    @Get('summary/by-category')
    @Roles('pm', 'accounting', 'tenant_admin')
    async summaryByCategory(
        @CurrentUser() user: ICurrentUser,
        @Query() query: ExpenseSummaryQueryDto,
    ) {
        return this.expensesService.getSummaryByCategory(user.tenantId, query);
    }

    @Get('summary/by-project')
    @Roles('pm', 'accounting', 'tenant_admin')
    async summaryByProject(
        @CurrentUser() user: ICurrentUser,
        @Query() query: ExpenseSummaryQueryDto,
    ) {
        return this.expensesService.getSummaryByProject(user.tenantId, query);
    }

    @Get('summary/by-month')
    @Roles('pm', 'accounting', 'tenant_admin')
    async summaryByMonth(
        @CurrentUser() user: ICurrentUser,
        @Query() query: ExpenseSummaryQueryDto,
    ) {
        return this.expensesService.getSummaryByMonth(user.tenantId, query);
    }

    @Get('summary/stats')
    @Roles('pm', 'accounting', 'tenant_admin')
    async summaryStats(
        @CurrentUser() user: ICurrentUser,
        @Query() query: ExpenseSummaryQueryDto,
    ) {
        return this.expensesService.getStats(user.tenantId, query);
    }
}
