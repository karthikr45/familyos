import type { Prisma, PrismaClient, User } from '@prisma/client';
import { prisma as defaultClient } from '../index';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<User, PrismaClient['user']> {
  protected get delegate() {
    return this.prisma.user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findWithProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true, familyMemberships: { include: { family: true } } },
    });
  }

  createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  softDelete(id: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { isDeleted: true } });
  }
}

export const userRepository = new UserRepository(defaultClient);
