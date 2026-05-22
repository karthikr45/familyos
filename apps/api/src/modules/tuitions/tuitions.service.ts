import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@familyos/database';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AddTuitionDto,
  MarkAttendanceDto,
  RecordPaymentDto,
  UpdateTuitionDto,
} from './dto/tuition.dto';

@Injectable()
export class TuitionsService {
  constructor(private readonly prisma: PrismaService) {}

  addTuition(studentId: string, dto: AddTuitionDto) {
    return this.prisma.tuition.create({
      data: {
        studentId,
        subjectId: dto.subjectId,
        tutorName: dto.tutorName,
        tutorPhone: dto.tutorPhone,
        venue: dto.venue,
        feesPerMonth: dto.feesPerMonth,
        schedule: (dto.schedule as Prisma.InputJsonValue) ?? undefined,
        startedAt: dto.startedAt,
      },
    });
  }

  getTuitions(studentId: string) {
    return this.prisma.tuition.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true } },
        _count: { select: { attendance: true, payments: true } },
      },
    });
  }

  async updateTuition(id: string, dto: UpdateTuitionDto) {
    await this.ensure(id);
    return this.prisma.tuition.update({ where: { id }, data: dto });
  }

  async removeTuition(id: string) {
    await this.ensure(id);
    await this.prisma.tuition.delete({ where: { id } });
    return { success: true };
  }

  async markAttendance(tuitionId: string, dto: MarkAttendanceDto) {
    await this.ensure(tuitionId);
    return this.prisma.tuitionAttendance.upsert({
      where: { tuitionId_date: { tuitionId, date: dto.date } },
      update: { status: dto.status, notes: dto.notes },
      create: { tuitionId, date: dto.date, status: dto.status, notes: dto.notes },
    });
  }

  getAttendance(tuitionId: string) {
    return this.prisma.tuitionAttendance.findMany({
      where: { tuitionId },
      orderBy: { date: 'desc' },
    });
  }

  async getAttendanceStats(tuitionId: string) {
    const records = await this.prisma.tuitionAttendance.findMany({ where: { tuitionId } });
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const cancelled = records.filter((r) => r.status === 'CANCELLED').length;
    const heldSessions = total - cancelled;
    return {
      total,
      present,
      absent,
      cancelled,
      attendancePercentage: heldSessions ? Math.round((present / heldSessions) * 100) : 0,
    };
  }

  async recordPayment(tuitionId: string, dto: RecordPaymentDto) {
    await this.ensure(tuitionId);
    const status = dto.status ?? (dto.paidAt ? 'PAID' : 'PENDING');
    return this.prisma.tuitionPayment.create({
      data: {
        tuitionId,
        amount: dto.amount,
        dueDate: dto.dueDate,
        paidAt: dto.paidAt,
        status,
      },
    });
  }

  getPayments(tuitionId: string) {
    return this.prisma.tuitionPayment.findMany({
      where: { tuitionId },
      orderBy: { dueDate: 'desc' },
    });
  }

  /**
   * Correlates tuition attendance with exam performance in the tuition's
   * subject to produce a simple effectiveness score (0–100).
   */
  async getEffectiveness(tuitionId: string) {
    const tuition = await this.prisma.tuition.findUnique({ where: { id: tuitionId } });
    if (!tuition) throw new NotFoundException('Tuition not found');

    const stats = await this.getAttendanceStats(tuitionId);

    let averageScore = 0;
    if (tuition.subjectId) {
      const attempts = await this.prisma.examAttempt.findMany({
        where: {
          studentId: tuition.studentId,
          completedAt: { not: null },
          exam: { subjectId: tuition.subjectId },
        },
        select: { score: true, totalMarks: true },
      });
      if (attempts.length > 0) {
        averageScore = Math.round(
          attempts.reduce(
            (sum, a) => sum + (a.totalMarks ? (a.score / a.totalMarks) * 100 : 0),
            0,
          ) / attempts.length,
        );
      }
    }

    // Blend attendance and subject score for an at-a-glance effectiveness signal.
    const effectivenessScore = Math.round(stats.attendancePercentage * 0.4 + averageScore * 0.6);
    return {
      attendancePercentage: stats.attendancePercentage,
      averageSubjectScore: averageScore,
      effectivenessScore,
    };
  }

  async getSummary(studentId: string) {
    const tuitions = await this.getTuitions(studentId);
    return Promise.all(
      tuitions.map(async (t) => ({
        ...t,
        attendance: await this.getAttendanceStats(t.id),
        effectiveness: await this.getEffectiveness(t.id),
      })),
    );
  }

  private async ensure(id: string) {
    const tuition = await this.prisma.tuition.findUnique({ where: { id } });
    if (!tuition) throw new NotFoundException('Tuition not found');
    return tuition;
  }
}
