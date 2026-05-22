import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { NOTIFICATION_TYPES } from '@familyos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../modules/ai/ai.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { JOBS, QUEUES } from '../queues/queue.constants';

interface AlertJobData {
  userId?: string;
  alertType?: string;
  studentId?: string;
  data?: Record<string, unknown>;
}

@Processor(QUEUES.ALERT)
export class AiAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<AlertJobData>): Promise<void> {
    switch (job.name) {
      case JOBS.AI_ALERT:
        return this.handleAiAlert(job.data);
      case JOBS.STRESS_PATTERN:
        return this.handleStressPattern();
      case JOBS.TUITION_EFFECTIVENESS:
        return this.handleTuitionEffectiveness();
      default:
        this.logger.debug(`Unhandled alert job: ${job.name}`);
    }
  }

  private async handleAiAlert(data: AlertJobData): Promise<void> {
    if (!data.userId || !data.alertType) return;
    const services = this.ai.servicesFor(data.userId);
    const alert = await services.parent.generateAiAlert(
      data.userId,
      data.alertType,
      data.data ?? {},
    );
    await this.notifications.sendPushNotification(
      data.userId,
      alert.title,
      alert.body,
      alert.data ?? {},
      data.alertType,
    );
  }

  /** Daily: scan recent moods per student and alert parents on stress signals. */
  private async handleStressPattern(): Promise<void> {
    const students = await this.prisma.studentProfile.findMany({
      select: { id: true, familyId: true, name: true },
    });

    for (const student of students) {
      const moods = await this.prisma.moodLog.findMany({
        where: { studentId: student.id },
        orderBy: { date: 'desc' },
        take: 7,
      });
      if (moods.length < 3) continue;

      const negative = moods.filter((m) => m.mood === 'SAD' || m.mood === 'VERY_SAD').length;
      if (negative < 3) continue;

      const parents = await this.prisma.familyMember.findMany({
        where: { familyId: student.familyId, role: 'PARENT' },
        select: { userId: true },
      });
      for (const parent of parents) {
        await this.notifications.sendAiAlert(parent.userId, NOTIFICATION_TYPES.STRESS_ALERT, {
          studentName: student.name,
          negativeDays: negative,
        });
      }
    }
  }

  /** Weekly: refresh tuition effectiveness signal (placeholder enqueue point). */
  private async handleTuitionEffectiveness(): Promise<void> {
    this.logger.debug('Tuition effectiveness analysis tick');
  }
}
