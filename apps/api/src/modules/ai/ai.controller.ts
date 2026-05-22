import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { BoardType, StudentProfileDto } from '@familyos/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FamilyGuard } from '../../common/guards/family.guard';
import type { AuthUser } from '../../common/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AiService } from './ai.service';
import {
  AnalyzeFoodPhotoDto,
  AskTutorDto,
  EvaluateAnswerDto,
  GenerateExamRequestDto,
  StudyPlanRequestDto,
  SuggestDinnerDto,
  SuggestOutingDto,
  SuggestVacationDto,
} from './dto/ai.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async studentProfileDto(studentId: string): Promise<StudentProfileDto> {
    const p = await this.prisma.studentProfile.findUnique({ where: { id: studentId } });
    if (!p) throw new NotFoundException('Student not found');
    return {
      id: p.id,
      userId: p.userId,
      familyId: p.familyId,
      name: p.name,
      dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
      class: p.class,
      board: p.board as BoardType,
      state: p.state,
      school: p.school,
      avatarUrl: p.avatarUrl,
    };
  }

  @Post('tutor/ask')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Ask the AI tutor a question (streaming SSE response)' })
  async askTutor(
    @CurrentUser() user: AuthUser,
    @Body() dto: AskTutorDto,
    @Res() res: Response,
  ): Promise<void> {
    const profile = await this.studentProfileDto(dto.studentId);

    let conversation = dto.conversationId
      ? await this.prisma.aiConversation.findUnique({
          where: { id: dto.conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null;
    if (!conversation) {
      conversation = await this.prisma.aiConversation.create({
        data: { studentId: dto.studentId, subject: dto.subjectId ?? null },
        include: { messages: true },
      });
    }

    const [subject, chapter] = await Promise.all([
      dto.subjectId
        ? this.prisma.subject.findUnique({ where: { id: dto.subjectId }, select: { name: true } })
        : null,
      dto.chapterId
        ? this.prisma.chapter.findUnique({ where: { id: dto.chapterId }, select: { name: true } })
        : null,
    ]);

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'USER', content: dto.question },
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(
      `event: conversation\ndata: ${JSON.stringify({ conversationId: conversation.id })}\n\n`,
    );

    const history = conversation.messages.map((m) => ({
      role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }));

    const services = this.ai.servicesFor(user.userId);
    let full = '';
    try {
      const stream = services.tutor.askTutor(
        profile,
        subject?.name,
        chapter?.name,
        dto.question,
        history,
      );
      for await (const chunk of stream) {
        full += chunk;
        res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
      }
      await this.prisma.aiMessage.create({
        data: { conversationId: conversation.id, role: 'ASSISTANT', content: full },
      });
      res.write('data: [DONE]\n\n');
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: (error as Error).message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post('tutor/study-plan')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Generate a personalised study plan' })
  async studyPlan(@CurrentUser() user: AuthUser, @Body() dto: StudyPlanRequestDto) {
    return this.redis.remember(`ai:studyplan:${dto.studentId}`, 3600, async () => {
      const profile = await this.studentProfileDto(dto.studentId);
      const [weakAreas, upcoming] = await Promise.all([
        this.prisma.weakArea.findMany({
          where: { studentId: dto.studentId },
          include: { subject: true, chapter: true },
        }),
        this.prisma.familyCalendarEvent.findMany({
          where: { familyId: profile.familyId, type: 'EXAM', startDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
          take: 5,
        }),
      ]);

      const services = this.ai.servicesFor(user.userId);
      return services.tutor.generateStudyPlan(
        profile,
        weakAreas.map((w) => ({
          subject: w.subject.name,
          chapter: w.chapter?.name,
          score: w.score,
        })),
        upcoming.map((e) => ({ title: e.title, subject: '', date: e.startDate.toISOString() })),
      );
    });
  }

  @Get('tutor/conversations')
  @ApiOperation({ summary: 'List AI tutor conversations for the student' })
  async conversations(@CurrentUser() user: AuthUser) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (!profile) return [];
    return this.prisma.aiConversation.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  @Post('exam/generate')
  @ApiOperation({ summary: 'Generate exam questions via AI' })
  async generateExam(@CurrentUser() user: AuthUser, @Body() dto: GenerateExamRequestDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
      include: {
        board: true,
        chapters: { where: { id: { in: dto.chapterIds } }, select: { name: true } },
      },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const services = this.ai.servicesFor(user.userId);
    return services.exam.generateExam({
      subject: subject.name,
      chapters: subject.chapters.map((c) => c.name),
      difficulty: dto.difficulty,
      count: dto.count ?? 10,
      board: (subject.board.code === 'CBSE' || subject.board.code === 'ICSE'
        ? subject.board.code
        : 'STATE') as BoardType,
      class: subject.class,
    });
  }

  @Post('exam/evaluate')
  @ApiOperation({ summary: 'Evaluate a long-form answer via AI' })
  async evaluate(@CurrentUser() user: AuthUser, @Body() dto: EvaluateAnswerDto) {
    const services = this.ai.servicesFor(user.userId);
    return services.exam.evaluateAnswer(
      dto.question,
      dto.studentAnswer,
      dto.maxMarks ?? 5,
      dto.referenceAnswer,
    );
  }

  @Post('health/analyze-food-photo')
  @ApiOperation({ summary: 'Identify food items from a photo' })
  async analyzeFoodPhoto(@CurrentUser() user: AuthUser, @Body() dto: AnalyzeFoodPhotoDto) {
    const services = this.ai.servicesFor(user.userId);
    return services.health.identifyFoodFromPhoto(dto.imageBase64);
  }

  @Get('health/insights/:studentId')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'AI health insights for a student' })
  async healthInsights(@CurrentUser() user: AuthUser, @Param('studentId') studentId: string) {
    return this.redis.remember(`ai:health:${studentId}`, 6 * 3600, async () => {
      const services = this.ai.servicesFor(user.userId);
      const [foodLogs, moods, sleeps, activities] = await Promise.all([
        this.prisma.foodLog.findMany({ where: { studentId }, take: 30 }),
        this.prisma.moodLog.findMany({ where: { studentId }, orderBy: { date: 'desc' }, take: 14 }),
        this.prisma.sleepLog.findMany({ where: { studentId }, orderBy: { date: 'desc' }, take: 7 }),
        this.prisma.activityLog.findMany({
          where: { studentId },
          orderBy: { date: 'desc' },
          take: 7,
        }),
      ]);
      const avgSleep =
        sleeps.length > 0 ? sleeps.reduce((s, l) => s + l.hoursSlept, 0) / sleeps.length : 0;
      const nutritionScore = foodLogs.length
        ? Math.round(100 - (foodLogs.filter((f) => f.isJunkFood).length / foodLogs.length) * 70)
        : 100;
      const insight = await services.health.generateHealthInsights({
        nutritionScore,
        activeDays: new Set(activities.map((a) => a.date.toISOString().slice(0, 10))).size,
        averageSleepHours: Math.round(avgSleep * 10) / 10,
        dominantMood: moods[0]?.mood ?? 'NEUTRAL',
      });
      return { insight };
    });
  }

  @Get('parent/weekly-digest/:familyId')
  @Roles('PARENT', 'ADMIN')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Generate a weekly digest for a family' })
  async weeklyDigest(@CurrentUser() user: AuthUser, @Param('familyId') familyId: string) {
    return this.redis.remember(`ai:digest:${familyId}`, 6 * 3600, async () => {
      const family = await this.prisma.family.findUnique({
        where: { id: familyId },
        include: { students: { take: 1 } },
      });
      if (!family) throw new NotFoundException('Family not found');
      const student = family.students[0];
      const services = this.ai.servicesFor(user.userId);
      return services.parent.generateWeeklyDigest(family.name, student?.name ?? 'your child', {
        studyHours: 0,
        averageExamScore: 0,
        nutritionScore: 100,
        activeDays: 0,
        totalSpent: 0,
        junkFoodSpend: 0,
        talentPracticeHours: 0,
        achievements: 0,
      });
    });
  }

  @Get('parent/tips/:studentId')
  @Roles('PARENT', 'ADMIN')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'Parenting tips based on a student' })
  async tips(@CurrentUser() user: AuthUser, @Param('studentId') studentId: string) {
    return this.redis.remember(`ai:tips:${studentId}`, 6 * 3600, async () => {
      const profile = await this.studentProfileDto(studentId);
      const services = this.ai.servicesFor(user.userId);
      const tip = await services.parent.generateParentingTip(profile, {
        studyHours: 0,
        averageExamScore: 0,
        nutritionScore: 100,
        activeDays: 0,
        totalSpent: 0,
        junkFoodSpend: 0,
        talentPracticeHours: 0,
        achievements: 0,
      });
      return { tip };
    });
  }

  @Post('family/suggest-vacation')
  @Roles('PARENT', 'ADMIN')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'AI vacation destination suggestions' })
  async suggestVacation(@CurrentUser() user: AuthUser, @Body() dto: SuggestVacationDto) {
    return this.redis.remember(
      `ai:vacation:${dto.familyId}:${dto.budget}:${dto.season ?? ''}`,
      24 * 3600,
      async () => {
        const services = this.ai.servicesFor(user.userId);
        return services.family.suggestVacationDestinations({
          budget: dto.budget,
          season: dto.season,
          interests: dto.interests,
        });
      },
    );
  }

  @Post('family/suggest-outing')
  @Roles('PARENT', 'ADMIN')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'AI educational outing suggestions' })
  async suggestOuting(@CurrentUser() user: AuthUser, @Body() dto: SuggestOutingDto) {
    const children = await this.prisma.studentProfile.findMany({
      where: { familyId: dto.familyId },
      select: { class: true },
    });
    const services = this.ai.servicesFor(user.userId);
    return services.family.suggestOutings({
      location: dto.location,
      childClasses: children.map((c) => c.class),
    });
  }

  @Post('family/suggest-dinner')
  @Roles('PARENT', 'ADMIN')
  @UseGuards(FamilyGuard)
  @ApiOperation({ summary: 'AI dinner plan suggestions' })
  async suggestDinner(@CurrentUser() user: AuthUser, @Body() dto: SuggestDinnerDto) {
    const services = this.ai.servicesFor(user.userId);
    return services.family.suggestDinnerPlan(
      'Balanced nutrition for a growing family',
      dto.preferences,
    );
  }

  @Get('usage')
  @ApiOperation({ summary: 'Token usage stats for billing awareness' })
  usage(@CurrentUser() user: AuthUser) {
    return this.ai.getUsageStats(user.userId);
  }
}
