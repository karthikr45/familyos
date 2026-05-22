import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { IST_TIMEZONE, NOTIFICATION_TYPES } from '@familyos/shared';
import { PrismaService } from '../prisma/prisma.service';
import { JOBS, QUEUES } from '../queues/queue.constants';

const IST = { timeZone: IST_TIMEZONE };

/**
 * Schedules recurring jobs (all times IST). Cron handlers enqueue BullMQ jobs;
 * the processors do the heavy lifting so scheduling stays fast and resilient.
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUES.DIGEST) private readonly digestQueue: Queue,
    @InjectQueue(QUEUES.REPORT) private readonly reportQueue: Queue,
    @InjectQueue(QUEUES.ALERT) private readonly alertQueue: Queue,
  ) {}

  private async enqueueReminderToStudents(type: string, title: string, body: string) {
    const students = await this.prisma.studentProfile.findMany({ select: { userId: true } });
    await this.notificationQueue.addBulk(
      students.map((s) => ({
        name: JOBS.SEND_PUSH,
        data: { userId: s.userId, type, title, body },
        opts: { removeOnComplete: true },
      })),
    );
  }

  private async enqueueReminderToParents(type: string, title: string, body: string) {
    const parents = await this.prisma.familyMember.findMany({
      where: { role: 'PARENT' },
      select: { userId: true },
      distinct: ['userId'],
    });
    await this.notificationQueue.addBulk(
      parents.map((p) => ({
        name: JOBS.SEND_PUSH,
        data: { userId: p.userId, type, title, body },
        opts: { removeOnComplete: true },
      })),
    );
  }

  @Cron('0 7 * * *', IST)
  async morningReminder() {
    this.logger.log('Morning reminder tick');
    await this.enqueueReminderToStudents(
      NOTIFICATION_TYPES.MORNING_REMINDER,
      'Good morning! 🌅',
      "Here's your study goal for today. Let's make it count!",
    );
    await this.enqueueReminderToParents(
      NOTIFICATION_TYPES.MORNING_REMINDER,
      "Today's overview",
      "See what's on your child's plate today.",
    );
  }

  @Cron('30 12 * * *', IST)
  async middayReminder() {
    await this.enqueueReminderToStudents(
      NOTIFICATION_TYPES.MIDDAY_REMINDER,
      'Lunch time 🍽️',
      'Remember to log your lunch.',
    );
  }

  @Cron('0 16 * * *', IST)
  async afternoonReminder() {
    await this.enqueueReminderToStudents(
      NOTIFICATION_TYPES.AFTERNOON_REMINDER,
      'Brain break 🧠',
      'Take a short break and check in with your mood.',
    );
  }

  @Cron('0 20 * * *', IST)
  async eveningReminder() {
    await this.enqueueReminderToStudents(
      NOTIFICATION_TYPES.EVENING_REMINDER,
      'Wind down 🌙',
      'Log dinner, your wins, and how you feel today.',
    );
    await this.enqueueReminderToParents(
      NOTIFICATION_TYPES.EVENING_REMINDER,
      "Today's digest",
      "Here's how your family's day went.",
    );
  }

  @Cron('0 9 * * 0', IST)
  async weeklyDigest() {
    this.logger.log('Weekly digest tick');
    const families = await this.prisma.family.findMany({ select: { id: true } });
    await this.digestQueue.addBulk(
      families.map((f) => ({ name: JOBS.WEEKLY_DIGEST, data: { familyId: f.id } })),
    );
  }

  @Cron('0 23 * * 6', IST)
  async weeklyReportGeneration() {
    const families = await this.prisma.family.findMany({ select: { id: true } });
    await this.reportQueue.addBulk(
      families.map((f) => ({ name: JOBS.WEEKLY_REPORT, data: { familyId: f.id } })),
    );
  }

  @Cron('0 0 1 * *', IST)
  async monthlyReportGeneration() {
    const families = await this.prisma.family.findMany({ select: { id: true } });
    await this.reportQueue.addBulk(
      families.map((f) => ({ name: JOBS.MONTHLY_REPORT, data: { familyId: f.id } })),
    );
  }

  @Cron('0 21 * * *', IST)
  async stressPatternAnalysis() {
    await this.alertQueue.add(JOBS.STRESS_PATTERN, {}, { removeOnComplete: true });
  }

  @Cron('0 8 * * 1', IST)
  async tuitionEffectiveness() {
    await this.alertQueue.add(JOBS.TUITION_EFFECTIVENESS, {}, { removeOnComplete: true });
  }
}
