import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@familyos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOpaqueToken, hashToken } from '../../common/utils/crypto.util';
import type { JwtPayload } from '../../common/types';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private signAccessToken(user: Pick<User, 'id' | 'role' | 'email' | 'phone'>): string {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      type: 'access',
    };
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') ?? '15m',
    });
  }

  private refreshTtlMs(): number {
    // Mirror JWT_REFRESH_EXPIRES_IN (default 7 days) for the DB record.
    const raw = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const match = raw.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unit = match[2];
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
    return value * unitMs;
  }

  async issueTokens(user: Pick<User, 'id' | 'role' | 'email' | 'phone'>): Promise<IssuedTokens> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = generateOpaqueToken();

    await this.prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
      },
    });

    return { accessToken, refreshToken };
  }

  /** Validate a refresh token, rotate it, and issue a fresh pair. */
  async rotateRefreshToken(rawToken: string): Promise<IssuedTokens & { userId: string }> {
    const hashed = hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: hashed },
      include: { user: true },
    });

    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Rotation: revoke the used token before issuing a new pair.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revoked: true },
    });

    const tokens = await this.issueTokens(record.user);
    return { ...tokens, userId: record.user.id };
  }

  async revokeToken(rawToken: string): Promise<void> {
    const hashed = hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { token: hashed, revoked: false },
      data: { revoked: true },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}
