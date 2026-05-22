import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOtp, hashPassword, verifyPassword } from '../../common/utils/crypto.util';
import { TokenService, type IssuedTokens } from './token.service';
import type { LoginDto, RegisterDto, VerifyOtpDto } from './dto/auth.dto';

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async sendOtp(phone: string): Promise<{ sent: boolean; expiresInSeconds: number }> {
    // Throttle: at most one active (unconsumed, unexpired) OTP per number.
    const recent = await this.prisma.otpVerification.findFirst({
      where: { phone, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent && recent.createdAt.getTime() > Date.now() - 60_000) {
      throw new BadRequestException('An OTP was just sent. Please wait before requesting again.');
    }

    const otp = generateOtp(6);
    await this.prisma.otpVerification.create({
      data: { phone, otp, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    });

    // TODO: integrate an SMS provider. In non-production we log the OTP.
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`OTP for ${phone}: ${otp}`);
    }

    return { sent: true, expiresInSeconds: OTP_TTL_MS / 1000 };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<IssuedTokens & { isNewUser: boolean }> {
    const record = await this.prisma.otpVerification.findFirst({
      where: { phone: dto.phone, consumed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new BadRequestException('No OTP requested for this number');
    if (record.expiresAt < new Date()) throw new BadRequestException('OTP has expired');
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException('Too many incorrect attempts. Request a new OTP.');
    }

    if (record.otp !== dto.otp) {
      await this.prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP');
    }

    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { consumed: true },
    });

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    const isNewUser = !user;
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: dto.phone, isVerified: true, role: 'PARENT' },
      });
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const tokens = await this.tokens.issueTokens(user);
    return { ...tokens, isNewUser };
  }

  async register(dto: RegisterDto): Promise<IssuedTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        name: dto.name,
        role: dto.role ?? 'PARENT',
        isVerified: false,
      },
    });

    return this.tokens.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<IssuedTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || user.isDeleted) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await verifyPassword(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.tokens.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<IssuedTokens> {
    try {
      const { accessToken, refreshToken: rotated } =
        await this.tokens.rotateRefreshToken(refreshToken);
      return { accessToken, refreshToken: rotated };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string): Promise<{ success: boolean }> {
    await this.tokens.revokeToken(refreshToken);
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        familyMemberships: { include: { family: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      studentProfile: user.studentProfile,
      families: user.familyMemberships.map((m) => ({ ...m.family, memberRole: m.role })),
      createdAt: user.createdAt,
    };
  }
}
