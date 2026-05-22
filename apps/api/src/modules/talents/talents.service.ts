import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AddAchievementDto,
  AddTalentDto,
  LogTalentSessionDto,
  UpdateTalentDto,
} from './dto/talent.dto';

@Injectable()
export class TalentsService {
  constructor(private readonly prisma: PrismaService) {}

  getCategories() {
    return this.prisma.talentCategory.findMany({ orderBy: { name: 'asc' } });
  }

  addTalent(studentId: string, dto: AddTalentDto) {
    return this.prisma.studentTalent.create({
      data: {
        studentId,
        talentCategoryId: dto.talentCategoryId,
        name: dto.name,
        coach: dto.coach,
        venue: dto.venue,
        startedAt: dto.startedAt,
      },
    });
  }

  getTalents(studentId: string) {
    return this.prisma.studentTalent.findMany({
      where: { studentId },
      include: {
        category: true,
        _count: { select: { sessions: true, achievements: true } },
      },
    });
  }

  async updateTalent(talentId: string, dto: UpdateTalentDto) {
    await this.ensureTalent(talentId);
    return this.prisma.studentTalent.update({ where: { id: talentId }, data: dto });
  }

  async logSession(talentId: string, dto: LogTalentSessionDto) {
    await this.ensureTalent(talentId);
    return this.prisma.talentSession.create({
      data: {
        studentTalentId: talentId,
        date: dto.date ?? new Date(),
        durationMinutes: dto.durationMinutes,
        notes: dto.notes,
      },
    });
  }

  getSessions(talentId: string) {
    return this.prisma.talentSession.findMany({
      where: { studentTalentId: talentId },
      orderBy: { date: 'desc' },
    });
  }

  async addAchievement(talentId: string, dto: AddAchievementDto) {
    await this.ensureTalent(talentId);
    return this.prisma.talentAchievement.create({
      data: {
        studentTalentId: talentId,
        title: dto.title,
        description: dto.description,
        date: dto.date,
        certificateUrl: dto.certificateUrl,
      },
    });
  }

  getAchievements(talentId: string) {
    return this.prisma.talentAchievement.findMany({
      where: { studentTalentId: talentId },
      orderBy: { date: 'desc' },
    });
  }

  async setCertificate(achievementId: string, certificateUrl: string) {
    const achievement = await this.prisma.talentAchievement.findUnique({
      where: { id: achievementId },
    });
    if (!achievement) throw new NotFoundException('Achievement not found');
    return this.prisma.talentAchievement.update({
      where: { id: achievementId },
      data: { certificateUrl },
    });
  }

  async getPortfolio(studentId: string) {
    const talents = await this.prisma.studentTalent.findMany({
      where: { studentId },
      include: {
        category: true,
        sessions: { orderBy: { date: 'desc' }, take: 10 },
        achievements: { orderBy: { date: 'desc' } },
      },
    });

    return talents.map((t) => {
      const totalPracticeMinutes = t.sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
      return {
        id: t.id,
        name: t.name,
        category: t.category,
        coach: t.coach,
        venue: t.venue,
        totalPracticeMinutes,
        achievements: t.achievements,
        recentSessions: t.sessions,
      };
    });
  }

  private async ensureTalent(talentId: string) {
    const talent = await this.prisma.studentTalent.findUnique({ where: { id: talentId } });
    if (!talent) throw new NotFoundException('Talent not found');
    return talent;
  }
}
