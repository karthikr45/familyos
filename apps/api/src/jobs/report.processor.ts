import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../modules/reports/reports.service';
import { JOBS, QUEUES, type ReportJob } from '../queues/queue.constants';

@Processor(QUEUES.REPORT)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
  ) {
    super();
  }

  async process(job: Job<ReportJob>): Promise<void> {
    const { familyId } = job.data;
    const parent = await this.prisma.familyMember.findFirst({
      where: { familyId, role: 'PARENT' },
      select: { userId: true },
    });
    if (!parent) return;

    const students = await this.prisma.studentProfile.findMany({
      where: { familyId },
      select: { id: true },
    });

    if (job.name === JOBS.WEEKLY_REPORT || job.name === JOBS.MONTHLY_REPORT) {
      for (const student of students) {
        await this.reports
          .generate(familyId, parent.userId, student.id)
          .catch((error) => this.logger.warn(`Report failed: ${(error as Error).message}`));
      }
    }
  }
}
