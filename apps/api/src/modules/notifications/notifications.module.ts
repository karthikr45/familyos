import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { AppGateway } from '../../gateways/app.gateway';
import { QUEUES } from '../../queues/queue.constants';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.get<string>('jwt.secret') }),
    }),
    BullModule.registerQueue(
      { name: QUEUES.NOTIFICATION },
      { name: QUEUES.DIGEST },
      { name: QUEUES.ALERT },
    ),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService, AppGateway],
  exports: [NotificationsService, PushService, AppGateway],
})
export class NotificationsModule {}
