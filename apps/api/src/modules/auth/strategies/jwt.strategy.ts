import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthUser, JwtPayload } from '../../../common/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        studentProfile: { select: { id: true } },
        familyMemberships: { select: { familyId: true } },
      },
    });
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      userId: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      studentProfileId: user.studentProfile?.id ?? null,
      familyIds: user.familyMemberships.map((m) => m.familyId),
    };
  }
}
