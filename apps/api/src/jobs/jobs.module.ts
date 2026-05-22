import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsModule } from '../modules/reports/reports.module';
import { QUEUES } from '../queues/queue.constants';
import { CronService } from './cron.service';
import { NotificationProcessor } from './notification.processor';
import { DigestProcessor } from './digest.processor';
import { ReportProcessor } from './report.processor';
import { AiAnalysisProcessor } from './ai-analysis.processor';

/**
 * Hosts BullMQ processors and the cron scheduler. Imported only by the worker
 * entrypoint so the HTTP API process does not also consume jobs.
 */
@Module({
  imports: [
    ReportsModule,
    BullModule.registerQueue(
      { name: QUEUES.NOTIFICATION },
      { name: QUEUES.DIGEST },
      { name: QUEUES.REPORT },
      { name: QUEUES.ALERT },
    ),
  ],
  providers: [
    CronService,
    NotificationProcessor,
    DigestProcessor,
    ReportProcessor,
    AiAnalysisProcessor,
  ],
})
export class JobsModule {}
