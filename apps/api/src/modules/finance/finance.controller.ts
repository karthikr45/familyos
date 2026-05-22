import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FamilyGuard } from '../../common/guards/family.guard';
import { FinanceService } from './finance.service';
import {
  CreateBudgetDto,
  CreateExpenseDto,
  GivePocketMoneyDto,
  PocketMoneySpendDto,
  UpdateExpenseDto,
} from './dto/finance.dto';

@ApiTags('finance')
@ApiBearerAuth()
@Roles('PARENT', 'ADMIN')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('expenses')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Log an expense' })
  createExpense(@CurrentUser('userId') userId: string, @Body() dto: CreateExpenseDto) {
    return this.financeService.createExpense(userId, dto);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get expenses (date range, category filter)' })
  getExpenses(
    @Query('familyId') familyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.financeService.getExpenses(familyId, from, to, categoryId);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update an expense' })
  updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.financeService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  deleteExpense(@Param('id') id: string) {
    return this.financeService.deleteExpense(id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Monthly summary with breakdowns' })
  summary(
    @Query('familyId') familyId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.financeService.getSummary(
      familyId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Post('budget')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Set a monthly budget per category' })
  setBudget(@Body() dto: CreateBudgetDto) {
    return this.financeService.setBudget(dto);
  }

  @Get('budget')
  @ApiOperation({ summary: 'Get current budgets with spend vs limit' })
  getBudgets(
    @Query('familyId') familyId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.financeService.getBudgets(
      familyId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('budget/alerts')
  @ApiOperation({ summary: 'Over-budget alerts' })
  budgetAlerts(@Query('familyId') familyId: string) {
    return this.financeService.getBudgetAlerts(familyId);
  }

  @Post('pocket-money')
  @ApiOperation({ summary: 'Give pocket money to a student' })
  givePocketMoney(@CurrentUser('userId') userId: string, @Body() dto: GivePocketMoneyDto) {
    return this.financeService.givePocketMoney(userId, dto);
  }

  @Get('pocket-money/:studentId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Pocket money history' })
  getPocketMoney(@Param('studentId') studentId: string) {
    return this.financeService.getPocketMoney(studentId);
  }

  @Post('pocket-money/:id/spend')
  @ApiOperation({ summary: 'Log pocket money spend' })
  spend(@Param('id') id: string, @Body() dto: PocketMoneySpendDto) {
    return this.financeService.logPocketMoneySpend(id, dto);
  }

  @Get('junk-food-report')
  @ApiOperation({ summary: 'Junk food spend summary' })
  junkFoodReport(@Query('familyId') familyId: string) {
    return this.financeService.getJunkFoodReport(familyId);
  }

  @Get('tuition-fees')
  @ApiOperation({ summary: 'All tuition fee tracking' })
  tuitionFees(@Query('familyId') familyId: string) {
    return this.financeService.getTuitionFees(familyId);
  }

  @Get('annual-report')
  @ApiOperation({ summary: 'Annual expense report by category' })
  annualReport(@Query('familyId') familyId: string, @Query('year') year?: string) {
    return this.financeService.getAnnualReport(familyId, year ? Number(year) : undefined);
  }
}
