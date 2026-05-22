import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { ReportsService } from '../modules/reports/reports.service';
import { NOTIFICATION_TYPES } from '@familyos/shared';
import { QUEUES, type DigestJob } from '../queues/queue.constants';

@Processor(QUEUES.DIGEST)
export class DigestProcessor extends WorkerHost {
  private readonly logger = new Logger(DigestProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<DigestJob>): Promise<void> {
    const { familyId } = job.data;
    const parents = await this.prisma.familyMember.findMany({
      where: { familyId, role: 'PARENT' },
      select: { userId: true },
    });
    if (parents.length === 0) return;

    // Generate the weekly report once (cached), then notify each parent.
    const report = await this.reports.generate(familyId, parents[0]!.userId).catch((error) => {
      this.logger.warn(`Digest generation failed for ${familyId}: ${(error as Error).message}`);
      return null;
    });

    for (const parent of parents) {
      await this.notifications.sendPushNotification(
        parent.userId,
        'Your weekly family digest is ready',
        report?.narrative?.slice(0, 140) ?? 'Tap to see how the week went.',
        { familyId, reportId: report?.id },
        NOTIFICATION_TYPES.WEEKLY_DIGEST,
      );
    }
  }
}
