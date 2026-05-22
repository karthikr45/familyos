import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, ensureCurriculum, unique } from './utils/setup';

describe('Student journey (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let studentId: string;
  let subjectId: string;
  let chapterId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const prisma = app.get(PrismaService);
    ({ subjectId, chapterId } = await ensureCurriculum(prisma));

    const email = `${unique('student')}@example.com`;
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'supersecret123', name: 'Student', role: 'STUDENT' });
    token = reg.body.data.accessToken;

    const family = await request(app.getHttpServer())
      .post('/api/family')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Student Family' });

    const profile = await request(app.getHttpServer())
      .post('/api/students/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ familyId: family.body.data.id, name: 'Aarav', class: 10, board: 'CBSE' });
    studentId = profile.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a student profile', () => {
    expect(studentId).toBeDefined();
  });

  it('logs a study session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/students/study-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId, subjectId, chapterId, durationMinutes: 45 })
      .expect(201);
    expect(res.body.data.durationMinutes).toBe(45);
  });

  it('reflects the session in the dashboard and streak', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/students/${studentId}/dashboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.weekStudyMinutes).toBeGreaterThanOrEqual(45);
    expect(res.body.data.streak).toBeGreaterThanOrEqual(1);
  });

  it('logs food and mood', async () => {
    await request(app.getHttpServer())
      .post('/api/health/food-log')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId, mealType: 'BREAKFAST', items: [{ name: 'Idli' }] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/health/mood')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId, mood: 'HAPPY' })
      .expect(201);
  });

  it('computes a nutrition score', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/health/nutrition-score/${studentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.score).toBeGreaterThan(0);
  });
});
