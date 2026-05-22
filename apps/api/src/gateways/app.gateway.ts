import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/types';

export type AppEvent =
  | 'notification:new'
  | 'exam:challenge-received'
  | 'report:ready'
  | 'alert:ai'
  | 'study:friend-online';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server?: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.query?.token as string | undefined);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.secret'),
      });

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      const memberships = await this.prisma.familyMember.findMany({
        where: { userId: payload.sub },
        select: { familyId: true },
      });
      for (const m of memberships) {
        client.join(`family:${m.familyId}`);
      }
      this.logger.debug(`Socket connected: user ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Socket disconnected: user ${client.data?.userId ?? 'unknown'}`);
  }

  // Server-side emit helpers (no-op in the worker process, which has no server).

  emitToUser(userId: string, event: AppEvent, payload: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToFamily(familyId: string, event: AppEvent, payload: unknown): void {
    this.server?.to(`family:${familyId}`).emit(event, payload);
  }
}
