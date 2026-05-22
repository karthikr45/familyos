import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, ensureCurriculum, setupParentWithFamily } from './utils/setup';

describe('Parent journey (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let userId: string;
  let familyId: string;
  let studentId: string;
  let categoryId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const prisma = app.get(PrismaService);
    ({ categoryId } = await ensureCurriculum(prisma));

    ({ accessToken: token, userId, familyId } = await setupParentWithFamily(app));

    const profile = await request(app.getHttpServer())
      .post('/api/students/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ familyId, name: 'Diya', class: 8, board: 'ICSE' });
    studentId = profile.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists children for the parent', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/parents/${userId}/children`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.some((c: { id: string }) => c.id === studentId)).toBe(true);
  });

  it('returns a child summary', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/parents/child/${studentId}/summary`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.child.id).toBe(studentId);
  });

  it('logs an expense and reflects it in the summary', async () => {
    await request(app.getHttpServer())
      .post('/api/finance/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ familyId, categoryId, amount: 1200, description: 'Textbooks' })
      .expect(201);

    const summary = await request(app.getHttpServer())
      .get('/api/finance/summary')
      .set('Authorization', `Bearer ${token}`)
      .query({ familyId })
      .expect(200);
    expect(summary.body.data.totalSpent).toBeGreaterThanOrEqual(1200);
  });

  it('builds the parent dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/parents/${userId}/dashboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.children.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.monthSpend).toBeGreaterThanOrEqual(1200);
  });
});
