export const QUEUES = {
  NOTIFICATION: 'notification-queue',
  DIGEST: 'digest-queue',
  REPORT: 'report-queue',
  ALERT: 'alert-queue',
} as const;

export const JOBS = {
  SEND_PUSH: 'send-push',
  SCHEDULED_NOTIFICATION: 'scheduled-notification',
  WEEKLY_DIGEST: 'weekly-digest',
  WEEKLY_REPORT: 'weekly-report',
  MONTHLY_REPORT: 'monthly-report',
  WEAK_AREA_DETECTION: 'weak-area-detection',
  STRESS_PATTERN: 'stress-pattern',
  TUITION_EFFECTIVENESS: 'tuition-effectiveness',
  AI_ALERT: 'ai-alert',
} as const;

export interface SendPushJob {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type: string;
}

export interface DigestJob {
  familyId: string;
}

export interface ReportJob {
  familyId: string;
}
