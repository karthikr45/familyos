import { Injectable } from '@nestjs/common';
import { getWeekRange, isJunkFood, MOOD_TYPES } from '@familyos/shared';
import type { FoodItem, MoodLevel } from '@familyos/shared';
import type { Prisma } from '@familyos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import type {
  LogActivityDto,
  LogFoodDto,
  LogMoodDto,
  LogParentMoodDto,
  LogSleepDto,
  LogStressReliefDto,
  ParentJournalDto,
} from './dto/health.dto';

function dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async logFood(dto: LogFoodDto) {
    const items = dto.items as FoodItem[];
    const junk = dto.isJunkFood ?? isJunkFood(items);
    return this.prisma.foodLog.create({
      data: {
        studentId: dto.studentId,
        date: dto.date ?? new Date(),
        mealType: dto.mealType,
        items: items as unknown as Prisma.InputJsonValue,
        calories: dto.calories,
        isJunkFood: junk,
        photoUrl: dto.photoUrl,
        loggedBy: 'STUDENT',
      },
    });
  }

  getFoodLogs(studentId: string, from?: string, to?: string) {
    return this.prisma.foodLog.findMany({
      where: { studentId, date: dateRange(from, to) },
      orderBy: { date: 'desc' },
    });
  }

  async analyzeFoodPhoto(userId: string, imageBase64: string) {
    const services = this.ai.servicesFor(userId);
    return services.health.identifyFoodFromPhoto(imageBase64);
  }

  logActivity(dto: LogActivityDto) {
    return this.prisma.activityLog.create({
      data: {
        studentId: dto.studentId,
        date: dto.date ?? new Date(),
        activityType: dto.activityType,
        durationMinutes: dto.durationMinutes,
        calories: dto.calories,
        notes: dto.notes,
      },
    });
  }

  getActivity(studentId: string, from?: string, to?: string) {
    return this.prisma.activityLog.findMany({
      where: { studentId, date: dateRange(from, to) },
      orderBy: { date: 'desc' },
    });
  }

  logSleep(dto: LogSleepDto) {
    const date = dto.date ?? new Date();
    return this.prisma.sleepLog.upsert({
      where: { studentId_date: { studentId: dto.studentId, date } },
      update: {
        bedTime: dto.bedTime,
        wakeTime: dto.wakeTime,
        hoursSlept: dto.hoursSlept,
        quality: dto.quality ?? 'FAIR',
      },
      create: {
        studentId: dto.studentId,
        date,
        bedTime: dto.bedTime,
        wakeTime: dto.wakeTime,
        hoursSlept: dto.hoursSlept,
        quality: dto.quality ?? 'FAIR',
      },
    });
  }

  getSleep(studentId: string, from?: string, to?: string) {
    return this.prisma.sleepLog.findMany({
      where: { studentId, date: dateRange(from, to) },
      orderBy: { date: 'desc' },
    });
  }

  logMood(dto: LogMoodDto) {
    return this.prisma.moodLog.create({
      data: {
        studentId: dto.studentId,
        date: dto.date ?? new Date(),
        mood: dto.mood,
        notes: dto.notes,
        isPrivate: dto.isPrivate ?? true,
      },
    });
  }

  /**
   * Parent-facing mood trend. Returns only an aggregated daily average — never
   * the raw private notes — to respect the student's privacy.
   */
  async getMoodTrend(studentId: string) {
    const { start } = getWeekRange();
    const fourWeeksAgo = new Date(start);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 21);

    const logs = await this.prisma.moodLog.findMany({
      where: { studentId, date: { gte: fourWeeksAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, mood: true },
    });

    const byDay = new Map<string, number[]>();
    for (const log of logs) {
      const key = log.date.toISOString().slice(0, 10);
      const value = MOOD_TYPES[log.mood as MoodLevel].value;
      const bucket = byDay.get(key) ?? [];
      bucket.push(value);
      byDay.set(key, bucket);
    }

    const points = [...byDay.entries()].map(([date, values]) => ({
      date,
      averageMood: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    }));

    const overallAvg = logs.length
      ? logs.reduce((sum, l) => sum + MOOD_TYPES[l.mood as MoodLevel].value, 0) / logs.length
      : 3;
    const dominantMood = (Object.keys(MOOD_TYPES) as MoodLevel[]).reduce((closest, mood) =>
      Math.abs(MOOD_TYPES[mood].value - overallAvg) <
      Math.abs(MOOD_TYPES[closest].value - overallAvg)
        ? mood
        : closest,
    );

    return { points, dominantMood };
  }

  logStressRelief(dto: LogStressReliefDto) {
    return this.prisma.stressReliefSession.create({
      data: {
        studentId: dto.studentId,
        sessionType: dto.sessionType,
        durationMinutes: dto.durationMinutes,
      },
    });
  }

  async getNutritionScore(studentId: string) {
    const { start, end } = getWeekRange();
    const logs = await this.prisma.foodLog.findMany({
      where: { studentId, date: { gte: start, lte: end } },
    });
    const junkFoodCount = logs.filter((l) => l.isJunkFood).length;
    const score = logs.length ? Math.round(100 - (junkFoodCount / logs.length) * 70) : 100;
    return { score, junkFoodCount, mealsLogged: logs.length };
  }

  async getSummary(studentId: string) {
    const { start, end } = getWeekRange();
    const [food, activities, sleeps, moodTrend] = await Promise.all([
      this.prisma.foodLog.findMany({ where: { studentId, date: { gte: start, lte: end } } }),
      this.prisma.activityLog.findMany({ where: { studentId, date: { gte: start, lte: end } } }),
      this.prisma.sleepLog.findMany({ where: { studentId, date: { gte: start, lte: end } } }),
      this.getMoodTrend(studentId),
    ]);

    const junkFoodCount = food.filter((f) => f.isJunkFood).length;
    return {
      studentId,
      weekStart: start,
      weekEnd: end,
      nutritionScore: food.length ? Math.round(100 - (junkFoodCount / food.length) * 70) : 100,
      activeDays: new Set(activities.map((a) => a.date.toISOString().slice(0, 10))).size,
      averageSleepHours:
        sleeps.length > 0
          ? Math.round((sleeps.reduce((s, l) => s + l.hoursSlept, 0) / sleeps.length) * 10) / 10
          : 0,
      moodTrend,
      junkFoodCount,
    };
  }

  // ---- Parent wellness (completely private) ----

  logParentMood(parentId: string, dto: LogParentMoodDto) {
    return this.prisma.parentMoodLog.create({
      data: {
        parentId,
        date: dto.date ?? new Date(),
        mood: dto.mood,
        notes: dto.notes,
        isPrivate: true,
      },
    });
  }

  logParentJournal(parentId: string, dto: ParentJournalDto) {
    return this.prisma.parentJournalEntry.create({
      data: { parentId, content: dto.content },
    });
  }
}
