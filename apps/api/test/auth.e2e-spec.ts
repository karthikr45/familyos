import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, unique } from './utils/setup';

describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `${unique('user')}@example.com`;
  const password = 'supersecret123';
  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, name: 'Test Parent', role: 'PARENT' })
      .expect(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, name: 'Dup' })
      .expect(409);
  });

  it('logs in with email and password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
    expect(accessToken).toBeDefined();
  });

  it('rejects bad credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' })
      .expect(401);
  });

  it('returns the current user from /auth/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.data.email).toBe(email);
  });

  it('rejects /auth/me without a token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('rotates tokens on refresh', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
    refreshToken = res.body.data.refreshToken;
  });

  it('completes the phone OTP flow', async () => {
    const phone = `+9198${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
    await request(app.getHttpServer()).post('/api/auth/send-otp').send({ phone }).expect(200);

    const record = await prisma.otpVerification.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });
    expect(record).toBeTruthy();

    const res = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ phone, otp: record!.otp })
      .expect(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('logs out (revokes the refresh token)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });
});
