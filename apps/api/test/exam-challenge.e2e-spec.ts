import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, ensureCurriculum, setupParentWithFamily, unique } from './utils/setup';

describe('Exam + peer challenge (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let familyId: string;
  let subjectId: string;
  let chapterId: string;
  let studentA: string;
  let studentB: string;
  let examId: string;
  let attemptId: string;
  let questionId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const prisma = app.get(PrismaService);
    ({ subjectId, chapterId } = await ensureCurriculum(prisma));
    ({ accessToken: token, familyId } = await setupParentWithFamily(app));

    const a = await request(app.getHttpServer())
      .post('/api/students/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ familyId, name: 'Player A', class: 10, board: 'CBSE' });
    studentA = a.body.data.id;

    // Second child needs its own user added to the family.
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: `${unique('child')}@example.com`, password: 'supersecret123', name: 'B' });
    const childUserId = (
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.data.accessToken}`)
    ).body.data.id;
    await request(app.getHttpServer())
      .post(`/api/family/${familyId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: childUserId, role: 'CHILD' });
    const b = await request(app.getHttpServer())
      .post('/api/students/profile')
      .set('Authorization', `Bearer ${reg.body.data.accessToken}`)
      .send({ familyId, name: 'Player B', class: 10, board: 'CBSE' });
    studentB = b.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('AI-generates an exam', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/exams/ai-generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Algebra Quiz',
        subjectId,
        chapterIds: [chapterId],
        difficulty: 'EASY',
        count: 1,
        studentId: studentA,
      })
      .expect(201);
    examId = res.body.data.id;
    questionId = res.body.data.questions[0].questionId;
    expect(examId).toBeDefined();
  });

  it('runs an attempt end to end', async () => {
    const attempt = await request(app.getHttpServer())
      .post(`/api/exams/${examId}/attempt`)
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId: studentA })
      .expect(201);
    attemptId = attempt.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/exams/attempts/${attemptId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId, selectedAnswer: 'A' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/exams/attempts/${attemptId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const results = await request(app.getHttpServer())
      .get(`/api/exams/attempts/${attemptId}/results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(results.body.data.percentage).toBeGreaterThanOrEqual(0);
  });

  it('creates and accepts a peer challenge', async () => {
    const challenge = await request(app.getHttpServer())
      .post(`/api/exams/${examId}/challenge`)
      .set('Authorization', `Bearer ${token}`)
      .send({ challengerStudentId: studentA, challengedStudentId: studentB })
      .expect(201);

    const accepted = await request(app.getHttpServer())
      .patch(`/api/exams/challenges/${challenge.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);
    expect(accepted.body.data.status).toBe('ACCEPTED');
  });
});
