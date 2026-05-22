import { Injectable, NotFoundException } from '@nestjs/common';
import { getWeekRange } from '@familyos/shared';
import type { Prisma } from '@familyos/database';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateCalendarEventDto,
  CreateDinnerDto,
  CreateFamilyDto,
  CreateOutingDto,
  CreateVacationDto,
  LogFamilyActivityDto,
  UpdateCalendarEventDto,
  UpdateVacationDto,
} from './dto/family.dto';

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async createFamily(userId: string, dto: CreateFamilyDto) {
    return this.prisma.$transaction(async (tx) => {
      const family = await tx.family.create({ data: { name: dto.name } });
      await tx.familyMember.create({ data: { familyId: family.id, userId, role: 'PARENT' } });
      return family;
    });
  }

  async getFamily(id: string) {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, role: true } } } },
        students: true,
      },
    });
    if (!family) throw new NotFoundException('Family not found');
    return family;
  }

  addMember(familyId: string, userId: string, role: 'PARENT' | 'CHILD') {
    return this.prisma.familyMember.create({ data: { familyId, userId, role } });
  }

  async removeMember(familyId: string, userId: string) {
    await this.prisma.familyMember.deleteMany({ where: { familyId, userId } });
    return { success: true };
  }

  getCalendar(familyId: string) {
    return this.prisma.familyCalendarEvent.findMany({
      where: { familyId },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Creates a calendar event and, when the event overlaps an existing EXAM,
   * returns a conflict warning so clients can prompt the user.
   */
  async addCalendarEvent(familyId: string, createdById: string, dto: CreateCalendarEventDto) {
    const event = await this.prisma.familyCalendarEvent.create({
      data: {
        familyId,
        createdById,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate,
        allDay: dto.allDay ?? false,
      },
    });

    let examConflict = null;
    if (dto.type === 'VACATION' || dto.type === 'OUTING') {
      const end = dto.endDate ?? dto.startDate;
      examConflict = await this.prisma.familyCalendarEvent.findFirst({
        where: {
          familyId,
          type: 'EXAM',
          startDate: { lte: end },
          OR: [
            { endDate: { gte: dto.startDate } },
            { endDate: null, startDate: { gte: dto.startDate } },
          ],
          id: { not: event.id },
        },
      });
    }

    return { event, examConflict };
  }

  async updateEvent(eventId: string, dto: UpdateCalendarEventDto) {
    await this.ensureEvent(eventId);
    return this.prisma.familyCalendarEvent.update({ where: { id: eventId }, data: dto });
  }

  async deleteEvent(eventId: string) {
    await this.ensureEvent(eventId);
    await this.prisma.familyCalendarEvent.delete({ where: { id: eventId } });
    return { success: true };
  }

  createVacation(familyId: string, dto: CreateVacationDto) {
    return this.prisma.vacationPlan.create({
      data: {
        familyId,
        destination: dto.destination,
        startDate: dto.startDate,
        endDate: dto.endDate,
        budget: dto.budget,
        itinerary: (dto.itinerary as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  getVacations(familyId: string) {
    return this.prisma.vacationPlan.findMany({
      where: { familyId },
      orderBy: { startDate: 'desc' },
    });
  }

  updateVacation(planId: string, dto: UpdateVacationDto) {
    return this.prisma.vacationPlan.update({
      where: { id: planId },
      data: {
        status: dto.status,
        budget: dto.budget,
        itinerary: (dto.itinerary as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  createOuting(familyId: string, dto: CreateOutingDto) {
    return this.prisma.outingPlan.create({
      data: {
        familyId,
        destination: dto.destination,
        date: dto.date,
        budget: dto.budget,
        educationalTags: (dto.educationalTags as Prisma.InputJsonValue) ?? undefined,
        notes: dto.notes,
      },
    });
  }

  getOutings(familyId: string) {
    return this.prisma.outingPlan.findMany({ where: { familyId }, orderBy: { date: 'desc' } });
  }

  createDinner(familyId: string, dto: CreateDinnerDto) {
    return this.prisma.dinnerPlan.create({
      data: {
        familyId,
        date: dto.date,
        type: dto.type,
        mealPlan: (dto.mealPlan as Prisma.InputJsonValue) ?? undefined,
        restaurantName: dto.restaurantName,
        estimatedCost: dto.estimatedCost,
      },
    });
  }

  getDinners(familyId: string) {
    const { start, end } = getWeekRange();
    return this.prisma.dinnerPlan.findMany({
      where: { familyId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
  }

  logActivity(familyId: string, dto: LogFamilyActivityDto) {
    return this.prisma.familyActivity.create({
      data: {
        familyId,
        activityType: dto.activityType,
        date: dto.date,
        durationMinutes: dto.durationMinutes,
        notes: dto.notes,
        participantIds: (dto.participantIds as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  getActivities(familyId: string) {
    return this.prisma.familyActivity.findMany({ where: { familyId }, orderBy: { date: 'desc' } });
  }

  async getBondingScore(familyId: string) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const activities = await this.prisma.familyActivity.findMany({
      where: { familyId, date: { gte: monthStart } },
      select: { date: true },
    });
    const activeDays = new Set(activities.map((a) => a.date.toISOString().slice(0, 10))).size;
    const lastActivity = await this.prisma.familyActivity.findFirst({
      where: { familyId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    const daysSinceLast = lastActivity
      ? Math.floor((Date.now() - lastActivity.date.getTime()) / 86_400_000)
      : null;

    return {
      activeDaysThisMonth: activeDays,
      score: Math.min(100, activeDays * 10),
      daysSinceLastActivity: daysSinceLast,
    };
  }

  uploadPhoto(
    familyId: string,
    url: string,
    uploadedById: string,
    caption?: string,
    eventId?: string,
  ) {
    return this.prisma.familyPhoto.create({
      data: { familyId, url, caption, eventId, uploadedById, takenAt: new Date() },
    });
  }

  async getPhotos(familyId: string, page = 1, pageSize = 20) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.familyPhoto.findMany({
        where: { familyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.familyPhoto.count({ where: { familyId } }),
    ]);
    return { items, total, page, pageSize: take, totalPages: Math.ceil(total / take) || 1 };
  }

  private async ensureEvent(eventId: string) {
    const event = await this.prisma.familyCalendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Calendar event not found');
    return event;
  }
}
