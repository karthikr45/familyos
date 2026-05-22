import { Injectable, NotFoundException } from '@nestjs/common';
import { getWeekRange } from '@familyos/shared';
import type { Prisma } from '@familyos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

interface WeeklyAggregate {
  academic: { studyMinutes: number; examsTaken: number; averageScore: number };
  health: { nutritionScore: number; activeDays: number; averageSleepHours: number };
  finance: { totalSpent: number; junkFoodSpend: number };
  talents: { practiceMinutes: number; achievements: number };
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  private async aggregateForStudent(
    studentId: string,
    familyId: string,
    start: Date,
    end: Date,
  ): Promise<WeeklyAggregate> {
    const [sessions, attempts, food, activities, sleeps, talentSessions, achievements, expenses] =
      await Promise.all([
        this.prisma.studySession.findMany({ where: { studentId, date: { gte: start, lte: end } } }),
        this.prisma.examAttempt.findMany({
          where: { studentId, completedAt: { gte: start, lte: end } },
        }),
        this.prisma.foodLog.findMany({ where: { studentId, date: { gte: start, lte: end } } }),
        this.prisma.activityLog.findMany({ where: { studentId, date: { gte: start, lte: end } } }),
        this.prisma.sleepLog.findMany({ where: { studentId, date: { gte: start, lte: end } } }),
        this.prisma.talentSession.findMany({
          where: { studentTalent: { studentId }, date: { gte: start, lte: end } },
        }),
        this.prisma.talentAchievement.count({
          where: { studentTalent: { studentId }, date: { gte: start, lte: end } },
        }),
        this.prisma.expense.findMany({
          where: { familyId, studentId, date: { gte: start, lte: end } },
        }),
      ]);

    const studyMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);
    const scores = attempts.map((a) => (a.totalMarks ? (a.score / a.totalMarks) * 100 : 0));
    const junkCount = food.filter((f) => f.isJunkFood).length;

    return {
      academic: {
        studyMinutes,
        examsTaken: attempts.length,
        averageScore: scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0,
      },
      health: {
        nutritionScore: food.length ? Math.round(100 - (junkCount / food.length) * 70) : 100,
        activeDays: new Set(activities.map((a) => a.date.toISOString().slice(0, 10))).size,
        averageSleepHours: sleeps.length
          ? Math.round((sleeps.reduce((s, l) => s + l.hoursSlept, 0) / sleeps.length) * 10) / 10
          : 0,
      },
      finance: {
        totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
        junkFoodSpend: expenses.filter((e) => e.isJunkFood).reduce((s, e) => s + e.amount, 0),
      },
      talents: {
        practiceMinutes: talentSessions.reduce((s, t) => s + t.durationMinutes, 0),
        achievements,
      },
    };
  }

  /** Build (and cache) the weekly report for a family/student for the current week. */
  async generate(familyId: string, userId: string, studentId?: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: { students: true },
    });
    if (!family) throw new NotFoundException('Family not found');

    const { start, end } = getWeekRange();
    const targetStudent = studentId
      ? family.students.find((s) => s.id === studentId)
      : family.students[0];

    const existing = await this.prisma.weeklyReport.findFirst({
      where: { familyId, studentId: targetStudent?.id ?? null, weekStart: start },
    });
    if (existing) return existing;

    const aggregate = targetStudent
      ? await this.aggregateForStudent(targetStudent.id, familyId, start, end)
      : null;

    let narrative: string | undefined;
    if (aggregate && targetStudent) {
      const services = this.ai.servicesFor(userId);
      const digest = await services.parent
        .generateWeeklyDigest(family.name, targetStudent.name, {
          studyHours: Math.round((aggregate.academic.studyMinutes / 60) * 10) / 10,
          averageExamScore: aggregate.academic.averageScore,
          nutritionScore: aggregate.health.nutritionScore,
          activeDays: aggregate.health.activeDays,
          totalSpent: aggregate.finance.totalSpent,
          junkFoodSpend: aggregate.finance.junkFoodSpend,
          talentPracticeHours: Math.round((aggregate.talents.practiceMinutes / 60) * 10) / 10,
          achievements: aggregate.talents.achievements,
        })
        .catch(() => null);
      narrative = digest
        ? `${digest.headline}\n\n${digest.academics}\n${digest.health}\n${digest.finance}\n${digest.talents}\n\n${digest.recommendation}`
        : undefined;
    }

    return this.prisma.weeklyReport.create({
      data: {
        familyId,
        studentId: targetStudent?.id ?? null,
        weekStart: start,
        weekEnd: end,
        academicData: (aggregate?.academic as Prisma.InputJsonValue) ?? undefined,
        healthData: (aggregate?.health as Prisma.InputJsonValue) ?? undefined,
        financeData: (aggregate?.finance as Prisma.InputJsonValue) ?? undefined,
        talentData: (aggregate?.talents as Prisma.InputJsonValue) ?? undefined,
        narrative,
      },
    });
  }

  async getStudentWeekly(studentId: string) {
    const { start } = getWeekRange();
    const report = await this.prisma.weeklyReport.findFirst({
      where: { studentId, weekStart: start },
      orderBy: { generatedAt: 'desc' },
    });
    if (report) return report;

    const student = await this.prisma.studentProfile.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const { end } = getWeekRange();
    return {
      studentId,
      weekStart: start,
      weekEnd: end,
      ...(await this.aggregateForStudent(studentId, student.familyId, start, end)),
      cached: false,
    };
  }

  getFamilyWeekly(familyId: string) {
    return this.prisma.weeklyReport.findMany({
      where: { familyId },
      orderBy: { weekStart: 'desc' },
      take: 8,
    });
  }

  async getStudentMonthly(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return {
      studentId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      ...(await this.aggregateForStudent(studentId, student.familyId, start, end)),
    };
  }

  async getStudentProgress(studentId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { studentId, completedAt: { not: null } },
      orderBy: { startedAt: 'asc' },
      include: { exam: { include: { subject: { select: { name: true } } } } },
    });
    return {
      studentId,
      totalExams: attempts.length,
      trend: attempts.map((a) => ({
        date: a.startedAt,
        subject: a.exam.subject.name,
        percentage: a.totalMarks ? Math.round((a.score / a.totalMarks) * 100) : 0,
      })),
    };
  }

  async getFinanceMonthly(familyId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const expenses = await this.prisma.expense.findMany({
      where: {
        familyId,
        date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) },
      },
      include: { category: { select: { name: true } } },
    });
    const byCategory = new Map<string, number>();
    for (const e of expenses) {
      byCategory.set(e.category.name, (byCategory.get(e.category.name) ?? 0) + e.amount);
    }
    return {
      familyId,
      month: m,
      year: y,
      total: expenses.reduce((s, e) => s + e.amount, 0),
      byCategory: [...byCategory.entries()].map(([name, total]) => ({ name, total })),
    };
  }

  async getFinanceAnnual(familyId: string, year?: number) {
    const y = year ?? new Date().getFullYear();
    const expenses = await this.prisma.expense.findMany({
      where: { familyId, date: { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) } },
      include: { category: { select: { name: true } } },
    });
    const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
    for (const e of expenses) {
      const bucket = byMonth[e.date.getMonth()];
      if (bucket) bucket.total += e.amount;
    }
    return { familyId, year: y, total: expenses.reduce((s, e) => s + e.amount, 0), byMonth };
  }
}
