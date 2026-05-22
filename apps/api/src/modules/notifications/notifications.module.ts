import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { QUEUES } from '../../queues/queue.constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUES.NOTIFICATION },
      { name: QUEUES.DIGEST },
      { name: QUEUES.ALERT },
    ),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
