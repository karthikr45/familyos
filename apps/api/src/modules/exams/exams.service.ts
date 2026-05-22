import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BoardType } from '@familyos/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AppGateway } from '../../gateways/app.gateway';
import type {
  AiGenerateExamDto,
  CreateChallengeDto,
  CreateExamDto,
  RespondChallengeDto,
  SubmitAnswerDto,
  UpdateExamDto,
} from './dto/exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly gateway: AppGateway,
  ) {}

  async create(creatorId: string, dto: CreateExamDto) {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: dto.questionIds } },
    });
    if (questions.length === 0) throw new BadRequestException('No valid questions provided');

    const totalMarks = questions.length;
    return this.prisma.exam.create({
      data: {
        title: dto.title,
        creatorId,
        subjectId: dto.subjectId,
        isPublic: dto.isPublic ?? false,
        timeLimit: dto.timeLimit,
        totalMarks,
        questions: {
          create: questions.map((q, index) => ({
            questionId: q.id,
            marks: 1,
            order: index + 1,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async list(creatorId: string, studentId?: string | null) {
    const challengeExamIds = studentId
      ? (
          await this.prisma.peerChallenge.findMany({
            where: { OR: [{ challengerId: studentId }, { challengedId: studentId }] },
            select: { examId: true },
          })
        ).map((c) => c.examId)
      : [];

    return this.prisma.exam.findMany({
      where: {
        OR: [{ creatorId }, { isPublic: true }, { id: { in: challengeExamIds } }],
      },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } }, subject: { select: { name: true } } },
    });
  }

  async getById(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' }, include: { question: true } },
        subject: true,
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async update(id: string, creatorId: string, dto: UpdateExamDto) {
    await this.assertOwner(id, creatorId);
    return this.prisma.exam.update({ where: { id }, data: dto });
  }

  async remove(id: string, creatorId: string) {
    await this.assertOwner(id, creatorId);
    await this.prisma.exam.delete({ where: { id } });
    return { success: true };
  }

  private async assertOwner(examId: string, creatorId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (exam.creatorId !== creatorId) throw new ForbiddenException('You do not own this exam');
  }

  async aiGenerate(userId: string, dto: AiGenerateExamDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
      include: {
        board: true,
        chapters: { where: { id: { in: dto.chapterIds } } },
      },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const services = this.ai.servicesFor(userId);
    const generated = await services.exam.generateExam({
      subject: subject.name,
      chapters: subject.chapters.map((c) => c.name),
      difficulty: dto.difficulty,
      count: dto.count ?? 10,
      board: (subject.board.code === 'CBSE' || subject.board.code === 'ICSE'
        ? subject.board.code
        : 'STATE') as BoardType,
      class: subject.class,
    });

    if (generated.length === 0) {
      throw new BadRequestException('AI failed to generate questions; please retry');
    }

    // Persist generated questions, then assemble the exam.
    return this.prisma.$transaction(async (tx) => {
      const created = [];
      for (const q of generated) {
        const question = await tx.question.create({
          data: {
            subjectId: subject.id,
            chapterId: dto.chapterIds[0] ?? null,
            text: q.text,
            type: q.type,
            difficulty: q.difficulty,
            options: q.options ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            createdBy: 'AI',
          },
        });
        created.push(question);
      }

      return tx.exam.create({
        data: {
          title: dto.title,
          creatorId: userId,
          subjectId: subject.id,
          isAiGenerated: true,
          totalMarks: created.length,
          questions: {
            create: created.map((q, index) => ({ questionId: q.id, marks: 1, order: index + 1 })),
          },
        },
        include: { questions: { include: { question: true } } },
      });
    });
  }

  async startAttempt(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { _count: { select: { questions: true } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    return this.prisma.examAttempt.create({
      data: { examId, studentId, totalMarks: exam.totalMarks },
    });
  }

  async submitAnswer(attemptId: string, dto: SubmitAnswerDto) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.completedAt) throw new BadRequestException('This attempt is already complete');

    const examQuestion = await this.prisma.examQuestion.findFirst({
      where: { examId: attempt.examId, questionId: dto.questionId },
      include: { question: true },
    });
    if (!examQuestion) throw new BadRequestException('Question is not part of this exam');

    const { question } = examQuestion;
    // Auto-grade objective questions; subjective ones default to pending (0).
    const isObjective = question.type === 'MCQ';
    const isCorrect =
      isObjective &&
      !!question.correctAnswer &&
      dto.selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    const marksAwarded = isCorrect ? examQuestion.marks : 0;

    return this.prisma.examAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId: dto.questionId } },
      update: { selectedAnswer: dto.selectedAnswer, isCorrect, marksAwarded },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedAnswer: dto.selectedAnswer,
        isCorrect,
        marksAwarded,
      },
    });
  }

  async completeAttempt(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.completedAt) return attempt;

    const score = attempt.answers.reduce((sum, a) => sum + a.marksAwarded, 0);
    const timeTaken = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

    const completed = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { completedAt: new Date(), score, timeTaken },
    });

    await this.updateWeakAreas(attempt.examId, completed.studentId);
    return completed;
  }

  /** Recompute weak areas from this exam's chapter-level performance. */
  private async updateWeakAreas(examId: string, studentId: string) {
    const answers = await this.prisma.examAnswer.findMany({
      where: { attempt: { examId, studentId } },
      include: { question: { select: { subjectId: true, chapterId: true } } },
    });

    const byChapter = new Map<string, { subjectId: string; correct: number; total: number }>();
    for (const a of answers) {
      const key = `${a.question.subjectId}:${a.question.chapterId ?? 'none'}`;
      const entry = byChapter.get(key) ?? {
        subjectId: a.question.subjectId,
        correct: 0,
        total: 0,
      };
      entry.total += 1;
      if (a.isCorrect) entry.correct += 1;
      byChapter.set(key, entry);
    }

    for (const [key, stats] of byChapter) {
      const rawChapter = key.split(':')[1];
      const chapterId = rawChapter === 'none' ? null : rawChapter;
      const scorePercent = stats.total ? (stats.correct / stats.total) * 100 : 0;
      if (scorePercent >= 60) continue;

      // chapterId is nullable, so a compound-unique upsert isn't usable here.
      const existing = await this.prisma.weakArea.findFirst({
        where: { studentId, subjectId: stats.subjectId, chapterId },
      });
      if (existing) {
        await this.prisma.weakArea.update({
          where: { id: existing.id },
          data: { score: scorePercent, lastDetectedAt: new Date() },
        });
      } else {
        await this.prisma.weakArea.create({
          data: { studentId, subjectId: stats.subjectId, chapterId, score: scorePercent },
        });
      }
    }
  }

  async getResults(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { include: { question: true } },
        exam: { include: { subject: true } },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const percentage = attempt.totalMarks
      ? Math.round((attempt.score / attempt.totalMarks) * 100)
      : 0;

    let insights;
    if (attempt.completedAt) {
      const services = this.ai.servicesFor(userId);
      insights = await services.exam
        .generateExamInsights({
          subject: attempt.exam.subject.name,
          scorePercent: percentage,
          questionResults: attempt.answers.map((a) => ({
            chapter: a.question.chapterId ?? undefined,
            isCorrect: a.isCorrect,
          })),
        })
        .catch(() => undefined);
    }

    return {
      attempt: {
        id: attempt.id,
        examId: attempt.examId,
        studentId: attempt.studentId,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        timeTaken: attempt.timeTaken,
      },
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        questionText: a.question.text,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: a.question.correctAnswer,
        isCorrect: a.isCorrect,
        marksAwarded: a.marksAwarded,
        explanation: a.question.explanation,
      })),
      percentage,
      insights,
    };
  }

  async createChallenge(examId: string, dto: CreateChallengeDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    const challenge = await this.prisma.peerChallenge.create({
      data: {
        examId,
        challengerId: dto.challengerStudentId,
        challengedId: dto.challengedStudentId,
        status: 'PENDING',
      },
    });

    const challenged = await this.prisma.studentProfile.findUnique({
      where: { id: dto.challengedStudentId },
      select: { userId: true },
    });
    if (challenged) {
      this.gateway.emitToUser(challenged.userId, 'exam:challenge-received', {
        challengeId: challenge.id,
        examId,
        examTitle: exam.title,
      });
    }
    return challenge;
  }

  async getChallenges(studentId: string) {
    return this.prisma.peerChallenge.findMany({
      where: { OR: [{ challengerId: studentId }, { challengedId: studentId }] },
      orderBy: { createdAt: 'desc' },
      include: { exam: { select: { title: true, subjectId: true } } },
    });
  }

  async respondChallenge(id: string, dto: RespondChallengeDto) {
    const challenge = await this.prisma.peerChallenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return this.prisma.peerChallenge.update({ where: { id }, data: { status: dto.status } });
  }

  async examHistory(studentId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { studentId, completedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      include: { exam: { include: { subject: { select: { name: true } } } } },
    });
    return attempts.map((a) => ({
      attemptId: a.id,
      examTitle: a.exam.title,
      subject: a.exam.subject.name,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.totalMarks ? Math.round((a.score / a.totalMarks) * 100) : 0,
      date: a.startedAt,
    }));
  }

  async weakAreas(studentId: string) {
    return this.prisma.weakArea.findMany({
      where: { studentId },
      orderBy: { score: 'asc' },
      include: { subject: { select: { name: true } }, chapter: { select: { name: true } } },
    });
  }
}
