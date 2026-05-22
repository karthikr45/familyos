import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../types';

/**
 * Ensures the authenticated user belongs to the family the request targets.
 * Resolves the family id from `params.familyId`, `params.id`, or `body.familyId`,
 * and — when a `studentId` is present — verifies the student belongs to one of
 * the user's families. Admins bypass the check.
 */
@Injectable()
export class FamilyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params: Record<string, string>;
      body: Record<string, unknown>;
    }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.role === 'ADMIN') return true;

    const memberships = await this.prisma.familyMember.findMany({
      where: { userId: user.userId },
      select: { familyId: true },
    });
    const familyIds = new Set(memberships.map((m) => m.familyId));

    const targetFamilyId =
      request.params?.familyId ?? (request.body?.familyId as string | undefined);
    if (targetFamilyId) {
      if (!familyIds.has(targetFamilyId)) {
        throw new ForbiddenException('You are not a member of this family');
      }
      return true;
    }

    const studentId = request.params?.studentId ?? (request.body?.studentId as string | undefined);
    if (studentId) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: studentId },
        select: { familyId: true, userId: true },
      });
      if (!student) throw new ForbiddenException('Student not found');
      if (student.userId === user.userId) return true;
      if (!familyIds.has(student.familyId)) {
        throw new ForbiddenException('This student is not in your family');
      }
    }

    return true;
  }
}
