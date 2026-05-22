import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly config: ConfigService) {
    const projectId = this.config.get<string>('firebase.projectId');
    const clientEmail = this.config.get<string>('firebase.clientEmail');
    const privateKey = this.config.get<string>('firebase.privateKey');

    if (projectId && clientEmail && privateKey) {
      this.app =
        admin.apps.length > 0
          ? admin.apps[0]!
          : admin.initializeApp({
              credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            });
    } else {
      this.logger.warn('Firebase not configured — push notifications will be logged only');
    }
  }

  /** Send a push to a device token. Falls back to logging if FCM is unconfigured. */
  async send(
    pushToken: string | null,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<boolean> {
    if (!this.app || !pushToken) {
      this.logger.debug(`[push:noop] ${title} — ${body}`);
      return false;
    }
    try {
      await admin.messaging(this.app).send({
        token: pushToken,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
      return true;
    } catch (error) {
      this.logger.warn(`Failed to send push: ${(error as Error).message}`);
      return false;
    }
  }
}
