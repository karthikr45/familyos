import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type { Prisma } from '@familyos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from './push.service';
import { JOBS, QUEUES, type DigestJob, type SendPushJob } from '../../queues/queue.constants';
import type { UpdatePreferenceDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    @InjectQueue(QUEUES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUES.DIGEST) private readonly digestQueue: Queue,
    @InjectQueue(QUEUES.ALERT) private readonly alertQueue: Queue,
  ) {}

  async list(userId: string, page = 1, pageSize = 20) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize: take, totalPages: Math.ceil(total / take) || 1 };
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { success: true };
  }

  getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({ where: { userId } });
  }

  updatePreference(userId: string, dto: UpdatePreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type: dto.type } },
      update: { enabled: dto.enabled, timeOfDay: dto.timeOfDay },
      create: { userId, type: dto.type, enabled: dto.enabled, timeOfDay: dto.timeOfDay },
    });
  }

  // -------------------------------------------------------------------------
  // Internal service methods (called by jobs and other modules)
  // -------------------------------------------------------------------------

  /** Persist a notification, respect preferences, and push to the device. */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
    type = 'GENERAL',
  ) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (pref && !pref.enabled) return null;

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: (data as Prisma.InputJsonValue) ?? undefined,
        sentAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });
    await this.push.send(user?.pushToken ?? null, title, body, { ...data, type });

    return notification;
  }

  /** Enqueue a notification to be delivered at a future time. */
  async scheduleNotification(
    userId: string,
    type: string,
    scheduledAt: Date,
    payload: Omit<SendPushJob, 'userId' | 'type'>,
  ) {
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await this.notificationQueue.add(
      JOBS.SCHEDULED_NOTIFICATION,
      { userId, type, ...payload } satisfies SendPushJob,
      { delay, removeOnComplete: true, removeOnFail: 100 },
    );
  }

  async sendFamilyDigest(familyId: string) {
    await this.digestQueue.add(JOBS.WEEKLY_DIGEST, { familyId } satisfies DigestJob, {
      removeOnComplete: true,
    });
  }

  async sendAiAlert(userId: string, alertType: string, data: Record<string, unknown>) {
    await this.alertQueue.add(
      JOBS.AI_ALERT,
      { userId, alertType, data },
      { removeOnComplete: true, removeOnFail: 100 },
    );
  }
}
