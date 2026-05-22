export * from './types';
export * from './client';
export * from './utils/prompt-builder';
export * from './utils/stream-handler';
export * from './services/tutor.service';
export * from './services/exam.service';
export * from './services/health.service';
export * from './services/parent.service';
export * from './services/family.service';

import type { AiClient } from './client';
import { TutorService } from './services/tutor.service';
import { ExamService } from './services/exam.service';
import { HealthService } from './services/health.service';
import { ParentService } from './services/parent.service';
import { FamilyService } from './services/family.service';

/** Bundles every AI service around a single shared client. */
export class AiServices {
  readonly tutor: TutorService;
  readonly exam: ExamService;
  readonly health: HealthService;
  readonly parent: ParentService;
  readonly family: FamilyService;

  constructor(client: AiClient) {
    this.tutor = new TutorService(client);
    this.exam = new ExamService(client);
    this.health = new HealthService(client);
    this.parent = new ParentService(client);
    this.family = new FamilyService(client);
  }
}
