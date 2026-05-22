import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AiService } from '../../src/modules/ai/ai.service';

/** A deterministic AiService stub so e2e tests never hit the Anthropic API. */
export const mockAiService = {
  servicesFor: () => ({
    tutor: {
      // eslint-disable-next-line require-yield
      askTutor: async function* () {
        yield 'This is a stubbed tutor answer.';
      },
      generateStudyPlan: async () => ({ summary: 'Plan', days: [], tips: [] }),
      detectWeakAreas: async () => [],
      generateExplanation: async () => 'Because.',
    },
    exam: {
      generateExam: async () => [
        {
          text: 'Stub question?',
          type: 'MCQ',
          difficulty: 'EASY',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'A is correct.',
        },
      ],
      evaluateAnswer: async () => ({ isCorrect: true, score: 1, feedback: 'Good' }),
      generateExamInsights: async () => ({
        summary: 'ok',
        weakAreas: [],
        recommendations: [],
        nextSteps: [],
      }),
    },
    health: {
      analyzeFoodLog: async () => ({ nutritionScore: 80, junkFoodCount: 0, suggestions: [] }),
      identifyFoodFromPhoto: async () => [],
      detectStressPattern: async () => ({
        stressDetected: false,
        level: 'LOW',
        summary: '',
        parentingTip: '',
      }),
      generateHealthInsights: async () => 'All good',
    },
    parent: {
      generateParentingTip: async () => 'Keep encouraging them.',
      generateWeeklyDigest: async () => ({
        headline: 'Great week',
        academics: '',
        health: '',
        finance: '',
        talents: '',
        recommendation: '',
      }),
      generateFinanceInsight: async () => 'Spending is on track.',
      generateAiAlert: async () => ({ userId: '', type: '', title: 't', body: 'b', data: {} }),
    },
    family: {
      suggestVacationDestinations: async () => [],
      suggestOutings: async () => [],
      suggestDinnerPlan: async () => ({ title: '', items: [], estimatedCalories: 0, notes: '' }),
      generateFamilyBondingActivity: async () => [],
    },
  }),
  getUsageStats: async () => ({
    totals: { inputTokens: 0, outputTokens: 0, calls: 0 },
    byFeature: [],
  }),
};

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AiService)
    .useValue(mockAiService)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

/** Generate a unique-ish identifier so repeated test runs don't collide. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

import type { PrismaService } from '../../src/prisma/prisma.service';

/** Ensure a board/subject/chapter/category exist so journeys can run on a fresh DB. */
export async function ensureCurriculum(prisma: PrismaService): Promise<{
  subjectId: string;
  chapterId: string;
  categoryId: string;
}> {
  const board = await prisma.board.upsert({
    where: { code: 'TEST' },
    update: {},
    create: { name: 'Test Board', code: 'TEST' },
  });
  const subject = await prisma.subject.upsert({
    where: { boardId_class_code: { boardId: board.id, class: 10, code: 'MATH' } },
    update: {},
    create: { boardId: board.id, class: 10, name: 'Mathematics', code: 'MATH' },
  });
  const chapter = await prisma.chapter.upsert({
    where: { subjectId_number: { subjectId: subject.id, number: 1 } },
    update: {},
    create: { subjectId: subject.id, name: 'Algebra', number: 1 },
  });
  const category = await prisma.expenseCategory.upsert({
    where: { name: 'Education' },
    update: {},
    create: { name: 'Education', icon: 'graduation-cap', isSystem: true },
  });
  return { subjectId: subject.id, chapterId: chapter.id, categoryId: category.id };
}

/** Register a parent and create a family; returns auth + ids. */
export async function setupParentWithFamily(
  app: INestApplication,
): Promise<{ accessToken: string; userId: string; familyId: string }> {
  const request = (await import('supertest')).default;
  const email = `${unique('parent')}@example.com`;
  const reg = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'supersecret123', name: 'Parent', role: 'PARENT' });
  const accessToken = reg.body.data.accessToken as string;

  const me = await request(app.getHttpServer())
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${accessToken}`);
  const userId = me.body.data.id as string;

  const family = await request(app.getHttpServer())
    .post('/api/family')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Test Family' });

  return { accessToken, userId, familyId: family.body.data.id as string };
}
