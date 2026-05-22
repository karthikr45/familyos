import type { Prisma, PrismaClient, StudentProfile } from '@prisma/client';
import { prisma as defaultClient } from '../index';
import { BaseRepository } from './base.repository';

export class StudentRepository extends BaseRepository<
  StudentProfile,
  PrismaClient['studentProfile']
> {
  protected get delegate() {
    return this.prisma.studentProfile;
  }

  findByUserId(userId: string): Promise<StudentProfile | null> {
    return this.prisma.studentProfile.findUnique({ where: { userId } });
  }

  findByFamily(familyId: string): Promise<StudentProfile[]> {
    return this.prisma.studentProfile.findMany({ where: { familyId } });
  }

  createProfile(data: Prisma.StudentProfileCreateInput): Promise<StudentProfile> {
    return this.prisma.studentProfile.create({ data });
  }

  findDashboard(id: string) {
    return this.prisma.studentProfile.findUnique({
      where: { id },
      include: {
        studyGoals: { orderBy: { createdAt: 'desc' }, take: 1 },
        weakAreas: { include: { subject: true, chapter: true } },
        examAttempts: { orderBy: { startedAt: 'desc' }, take: 5, include: { exam: true } },
      },
    });
  }
}

export const studentRepository = new StudentRepository(defaultClient);
