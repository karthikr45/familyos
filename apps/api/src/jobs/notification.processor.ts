import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { JOBS, QUEUES, type SendPushJob } from '../queues/queue.constants';

@Processor(QUEUES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<SendPushJob>): Promise<void> {
    if (job.name === JOBS.SCHEDULED_NOTIFICATION || job.name === JOBS.SEND_PUSH) {
      const { userId, title, body, data, type } = job.data;
      await this.notifications.sendPushNotification(userId, title, body, data ?? {}, type);
      this.logger.debug(`Delivered ${job.name} to user ${userId}`);
    }
  }
}
