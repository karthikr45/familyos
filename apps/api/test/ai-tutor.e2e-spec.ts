import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, ensureCurriculum, setupParentWithFamily } from './utils/setup';

describe('AI tutor (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let familyId: string;
  let subjectId: string;
  let studentId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const prisma = app.get(PrismaService);
    ({ subjectId } = await ensureCurriculum(prisma));
    ({ accessToken: token, familyId } = await setupParentWithFamily(app));

    const profile = await request(app.getHttpServer())
      .post('/api/students/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ familyId, name: 'Learner', class: 10, board: 'CBSE' });
    studentId = profile.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('streams a tutor answer over SSE', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/tutor/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId, subjectId, question: 'Explain factoring.' })
      .expect(200);
    expect(res.text).toContain('stubbed tutor answer');
    expect(res.text).toContain('[DONE]');
  });

  it('persists the conversation and messages', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ai/tutor/conversations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].messages.length).toBeGreaterThanOrEqual(2);
  });
});
