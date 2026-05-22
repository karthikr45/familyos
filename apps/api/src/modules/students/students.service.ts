import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { calculateStudyStreak, getWeekRange } from '@familyos/shared';
import type { StudySessionDto } from '@familyos/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateStudentProfileDto,
  LogStudySessionDto,
  UpdateStudentProfileDto,
} from './dto/student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateStudentProfileDto) {
    const membership = await this.prisma.familyMember.findFirst({
      where: { userId, familyId: dto.familyId },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this family');

    return this.prisma.studentProfile.create({
      data: {
        userId,
        familyId: dto.familyId,
        name: dto.name,
        dateOfBirth: dto.dateOfBirth,
        class: dto.class,
        board: dto.board,
        state: dto.state,
        school: dto.school,
      },
    });
  }

  async getProfileByUser(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { studyGoals: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!profile) throw new NotFoundException('Student profile not found');
    return profile;
  }

  async updateProfileByUser(userId: string, dto: UpdateStudentProfileDto) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Student profile not found');
    return this.prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        name: dto.name,
        dateOfBirth: dto.dateOfBirth,
        class: dto.class,
        board: dto.board,
        state: dto.state,
        school: dto.school,
      },
    });
  }

  async getDashboard(studentId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        studyGoals: { orderBy: { createdAt: 'desc' }, take: 1 },
        weakAreas: { include: { subject: true, chapter: true }, take: 5 },
      },
    });
    if (!profile) throw new NotFoundException('Student not found');

    const { start, end } = getWeekRange();
    const [recentSessions, recentAttempts, weekSessions] = await Promise.all([
      this.prisma.studySession.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      this.prisma.examAttempt.findMany({
        where: { studentId, completedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
        take: 5,
        include: { exam: { select: { title: true, subjectId: true } } },
      }),
      this.prisma.studySession.findMany({
        where: { studentId, date: { gte: start, lte: end } },
      }),
    ]);

    const streak = calculateStudyStreak(
      recentSessions.map(
        (s) => ({ ...s, date: s.date.toISOString() }) as unknown as StudySessionDto,
      ),
    );
    const weekMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    return {
      profile,
      streak,
      weekStudyMinutes: weekMinutes,
      dailyGoal: profile.studyGoals[0]?.targetMinutesPerDay ?? 0,
      recentExams: recentAttempts,
      weakAreas: profile.weakAreas,
    };
  }

  async getStudySessions(studentId: string, page = 1, pageSize = 20) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.studySession.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        skip,
        take,
        include: { subject: { select: { name: true } }, chapter: { select: { name: true } } },
      }),
      this.prisma.studySession.count({ where: { studentId } }),
    ]);
    return { items, total, page, pageSize: take, totalPages: Math.ceil(total / take) || 1 };
  }

  async logStudySession(dto: LogStudySessionDto) {
    return this.prisma.studySession.create({
      data: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        chapterId: dto.chapterId,
        durationMinutes: dto.durationMinutes,
        date: dto.date ?? new Date(),
        notes: dto.notes,
      },
    });
  }

  async getProgress(studentId: string) {
    const sessions = await this.prisma.studySession.groupBy({
      by: ['subjectId'],
      where: { studentId },
      _sum: { durationMinutes: true },
      _count: true,
    });

    const subjectIds = sessions.map((s) => s.subjectId);
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(subjects.map((s) => [s.id, s.name]));

    const attempts = await this.prisma.examAttempt.findMany({
      where: { studentId, completedAt: { not: null } },
      orderBy: { startedAt: 'asc' },
      select: { score: true, totalMarks: true, startedAt: true },
    });

    const scoreTrend = attempts.map((a) => ({
      date: a.startedAt,
      percentage: a.totalMarks ? Math.round((a.score / a.totalMarks) * 100) : 0,
    }));

    return {
      bySubject: sessions.map((s) => ({
        subjectId: s.subjectId,
        subjectName: nameById.get(s.subjectId) ?? 'Unknown',
        totalMinutes: s._sum.durationMinutes ?? 0,
        sessionCount: s._count,
      })),
      scoreTrend,
      averageScore:
        scoreTrend.length > 0
          ? Math.round(scoreTrend.reduce((sum, s) => sum + s.percentage, 0) / scoreTrend.length)
          : 0,
    };
  }

  async getStreaks(studentId: string) {
    const sessions = await this.prisma.studySession.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 365,
      select: { date: true },
    });
    const dtoSessions = sessions.map(
      (s) => ({ date: s.date.toISOString() }) as unknown as StudySessionDto,
    );
    return {
      current: calculateStudyStreak(dtoSessions),
      lastStudiedDate: sessions[0]?.date ?? null,
      totalStudyDays: new Set(sessions.map((s) => s.date.toISOString().slice(0, 10))).size,
    };
  }
}
