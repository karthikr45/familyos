import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { calculateStudyStreak, getWeekRange } from '@familyos/shared';
import type { StudySessionDto } from '@familyos/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateParentProfileDto } from './dto/parent.dto';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Sets the user up as a parent: ensures PARENT role, creates a family. */
  async createProfile(userId: string, dto: CreateParentProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: 'PARENT', ...(dto.name ? { name: dto.name } : {}) },
      });

      const family = await tx.family.create({ data: { name: dto.familyName } });
      await tx.familyMember.create({
        data: { familyId: family.id, userId, role: 'PARENT' },
      });

      return family;
    });
  }

  private async assertParentSelf(requestUserId: string, parentId: string, role: string) {
    if (role !== 'ADMIN' && requestUserId !== parentId) {
      throw new ForbiddenException('You can only access your own parent data');
    }
  }

  private async familyIdsFor(parentId: string): Promise<string[]> {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId: parentId },
      select: { familyId: true },
    });
    return memberships.map((m) => m.familyId);
  }

  async getChildren(requestUserId: string, parentId: string, role: string) {
    await this.assertParentSelf(requestUserId, parentId, role);
    const familyIds = await this.familyIdsFor(parentId);
    return this.prisma.studentProfile.findMany({
      where: { familyId: { in: familyIds } },
      include: { studyGoals: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async getDashboard(requestUserId: string, parentId: string, role: string) {
    await this.assertParentSelf(requestUserId, parentId, role);
    const familyIds = await this.familyIdsFor(parentId);
    const { start, end } = getWeekRange();

    const children = await this.prisma.studentProfile.findMany({
      where: { familyId: { in: familyIds } },
    });

    const childSummaries = await Promise.all(
      children.map(async (child) => {
        const [sessions, lastAttempt, latestMood] = await Promise.all([
          this.prisma.studySession.findMany({
            where: { studentId: child.id, date: { gte: start, lte: end } },
          }),
          this.prisma.examAttempt.findFirst({
            where: { studentId: child.id, completedAt: { not: null } },
            orderBy: { startedAt: 'desc' },
          }),
          this.prisma.moodLog.findFirst({
            where: { studentId: child.id },
            orderBy: { date: 'desc' },
            select: { mood: true, date: true },
          }),
        ]);
        return {
          id: child.id,
          name: child.name,
          class: child.class,
          board: child.board,
          weekStudyMinutes: sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
          lastExamScore: lastAttempt
            ? lastAttempt.totalMarks
              ? Math.round((lastAttempt.score / lastAttempt.totalMarks) * 100)
              : 0
            : null,
          latestMood: latestMood?.mood ?? null,
        };
      }),
    );

    const [activeAlerts, upcomingEvents, monthExpenses] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: parentId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.familyCalendarEvent.findMany({
        where: { familyId: { in: familyIds }, startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        take: 5,
      }),
      this.prisma.expense.aggregate({
        where: {
          familyId: { in: familyIds },
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      children: childSummaries,
      alerts: activeAlerts,
      upcomingEvents,
      monthSpend: monthExpenses._sum.amount ?? 0,
    };
  }

  async getChildSummary(requestUserId: string, studentId: string, role: string) {
    const child = await this.prisma.studentProfile.findUnique({ where: { id: studentId } });
    if (!child) throw new NotFoundException('Student not found');

    if (role !== 'ADMIN') {
      const familyIds = await this.familyIdsFor(requestUserId);
      if (!familyIds.includes(child.familyId)) {
        throw new ForbiddenException('This student is not in your family');
      }
    }

    const { start, end } = getWeekRange();
    const [sessions, attempts, weakAreas] = await Promise.all([
      this.prisma.studySession.findMany({
        where: { studentId, date: { gte: start, lte: end } },
      }),
      this.prisma.examAttempt.findMany({
        where: { studentId, completedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
      this.prisma.weakArea.findMany({
        where: { studentId },
        include: { subject: true, chapter: true },
      }),
    ]);

    const allSessions = await this.prisma.studySession.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 60,
      select: { date: true },
    });

    return {
      child,
      weekStudyMinutes: sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
      streak: calculateStudyStreak(
        allSessions.map((s) => ({ date: s.date.toISOString() }) as unknown as StudySessionDto),
      ),
      recentExams: attempts,
      weakAreas,
    };
  }
}
