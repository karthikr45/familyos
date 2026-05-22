import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JUNK_FOOD_SPEND_THRESHOLD } from '@familyos/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateBudgetDto,
  CreateExpenseDto,
  GivePocketMoneyDto,
  PocketMoneySpendDto,
  UpdateExpenseDto,
} from './dto/finance.dto';

function monthRange(month: number, year: number): { gte: Date; lt: Date } {
  return { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  createExpense(loggedById: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        familyId: dto.familyId,
        studentId: dto.studentId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        description: dto.description,
        date: dto.date ?? new Date(),
        isJunkFood: dto.isJunkFood ?? false,
        receiptUrl: dto.receiptUrl,
        loggedById,
      },
    });
  }

  getExpenses(familyId: string, from?: string, to?: string, categoryId?: string) {
    return this.prisma.expense.findMany({
      where: {
        familyId,
        categoryId: categoryId || undefined,
        date:
          from || to
            ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined }
            : undefined,
      },
      orderBy: { date: 'desc' },
      include: { category: { select: { name: true, icon: true } } },
    });
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    await this.ensureExpense(id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        description: dto.description,
        date: dto.date,
        isJunkFood: dto.isJunkFood,
        studentId: dto.studentId,
      },
    });
  }

  async deleteExpense(id: string) {
    await this.ensureExpense(id);
    await this.prisma.expense.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async getSummary(familyId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const range = monthRange(m, y);

    const expenses = await this.prisma.expense.findMany({
      where: { familyId, date: range },
      include: { category: { select: { name: true } } },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategoryMap = new Map<string, { name: string; total: number }>();
    for (const e of expenses) {
      const entry = byCategoryMap.get(e.categoryId) ?? { name: e.category.name, total: 0 };
      entry.total += e.amount;
      byCategoryMap.set(e.categoryId, entry);
    }

    const budgets = await this.prisma.budget.findMany({
      where: { familyId, month: m, year: y },
    });

    return {
      month: m,
      year: y,
      totalSpent,
      byCategory: [...byCategoryMap.entries()].map(([categoryId, v]) => ({
        categoryId,
        categoryName: v.name,
        total: v.total,
        percentage: totalSpent ? Math.round((v.total / totalSpent) * 100) : 0,
      })),
      junkFoodSpend: expenses.filter((e) => e.isJunkFood).reduce((s, e) => s + e.amount, 0),
      budgetTotal: budgets.reduce((s, b) => s + b.monthlyLimit, 0),
    };
  }

  setBudget(dto: CreateBudgetDto) {
    return this.prisma.budget.upsert({
      where: {
        familyId_categoryId_month_year: {
          familyId: dto.familyId,
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
      update: { monthlyLimit: dto.monthlyLimit },
      create: dto,
    });
  }

  async getBudgets(familyId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const budgets = await this.prisma.budget.findMany({
      where: { familyId, month: m, year: y },
      include: { category: { select: { name: true, icon: true } } },
    });

    const range = monthRange(m, y);
    const spendByCategory = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { familyId, date: range },
      _sum: { amount: true },
    });
    const spendMap = new Map(spendByCategory.map((s) => [s.categoryId, s._sum.amount ?? 0]));

    return budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category.name,
      monthlyLimit: b.monthlyLimit,
      spent: spendMap.get(b.categoryId) ?? 0,
      month: b.month,
      year: b.year,
    }));
  }

  async getBudgetAlerts(familyId: string) {
    const budgets = await this.getBudgets(familyId);
    return budgets
      .filter((b) => b.spent >= b.monthlyLimit * 0.9)
      .map((b) => ({
        categoryName: b.categoryName,
        monthlyLimit: b.monthlyLimit,
        spent: b.spent,
        overBy: Math.max(0, b.spent - b.monthlyLimit),
        severity: b.spent > b.monthlyLimit ? 'OVER' : 'NEAR',
      }));
  }

  givePocketMoney(givenById: string, dto: GivePocketMoneyDto) {
    return this.prisma.pocketMoney.create({
      data: { studentId: dto.studentId, amount: dto.amount, givenById },
    });
  }

  async getPocketMoney(studentId: string) {
    const entries = await this.prisma.pocketMoney.findMany({
      where: { studentId },
      orderBy: { givenAt: 'desc' },
      include: { spends: true },
    });
    const given = entries.reduce((s, e) => s + e.amount, 0);
    const spent = entries.reduce((s, e) => s + e.spends.reduce((ss, sp) => ss + sp.amount, 0), 0);
    return { entries, balance: given - spent, totalGiven: given, totalSpent: spent };
  }

  async logPocketMoneySpend(pocketMoneyId: string, dto: PocketMoneySpendDto) {
    const pm = await this.prisma.pocketMoney.findUnique({ where: { id: pocketMoneyId } });
    if (!pm) throw new NotFoundException('Pocket money record not found');
    return this.prisma.pocketMoneySpend.create({
      data: { pocketMoneyId, amount: dto.amount, description: dto.description },
    });
  }

  async getJunkFoodReport(familyId: string) {
    const now = new Date();
    const range = monthRange(now.getMonth() + 1, now.getFullYear());
    const expenses = await this.prisma.expense.findMany({
      where: { familyId, isJunkFood: true, date: range },
      orderBy: { date: 'desc' },
    });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      total,
      count: expenses.length,
      overThreshold: total > JUNK_FOOD_SPEND_THRESHOLD,
      threshold: JUNK_FOOD_SPEND_THRESHOLD,
      expenses,
    };
  }

  async getTuitionFees(familyId: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: { familyId },
      select: { id: true, name: true },
    });
    const tuitions = await this.prisma.tuition.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      include: { payments: { orderBy: { dueDate: 'desc' } } },
    });
    const nameById = new Map(students.map((s) => [s.id, s.name]));
    return tuitions.map((t) => ({
      tuitionId: t.id,
      studentName: nameById.get(t.studentId) ?? 'Unknown',
      tutorName: t.tutorName,
      feesPerMonth: t.feesPerMonth,
      payments: t.payments,
      pendingAmount: t.payments
        .filter((p) => p.status !== 'PAID')
        .reduce((s, p) => s + p.amount, 0),
    }));
  }

  async getAnnualReport(familyId: string, year?: number) {
    const y = year ?? new Date().getFullYear();
    const expenses = await this.prisma.expense.findMany({
      where: { familyId, date: { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) } },
      include: { category: { select: { name: true } } },
    });

    const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
    const byCategory = new Map<string, number>();
    for (const e of expenses) {
      const monthBucket = byMonth[e.date.getMonth()];
      if (monthBucket) monthBucket.total += e.amount;
      byCategory.set(e.category.name, (byCategory.get(e.category.name) ?? 0) + e.amount);
    }

    if (expenses.length === 0) throw new BadRequestException('No expenses recorded for this year');

    return {
      year: y,
      total: expenses.reduce((s, e) => s + e.amount, 0),
      byMonth,
      byCategory: [...byCategory.entries()].map(([name, total]) => ({ name, total })),
    };
  }
}
