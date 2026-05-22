import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { UpdateProfileDto, UploadedFileLike } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, email: dto.email, avatarUrl: dto.avatarUrl },
    });
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async uploadAvatar(userId: string, file: UploadedFileLike) {
    const url = await this.storage.upload(`avatars/${userId}`, file);
    await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
    return { avatarUrl: url };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { isDeleted: true } });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    return { success: true };
  }

  async getFamily(userId: string) {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId },
      include: {
        family: {
          include: {
            members: { include: { user: { select: { id: true, name: true, role: true } } } },
            students: true,
          },
        },
      },
    });
    return memberships.map((m) => m.family);
  }
}
