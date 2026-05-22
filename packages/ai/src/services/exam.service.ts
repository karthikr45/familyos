import type { BoardType, Difficulty } from '@familyos/shared';
import type { AiClient } from '../client';
import { bulletList } from '../utils/prompt-builder';
import type { AnswerEvaluation, ExamInsightDto, GeneratedQuestion } from '../types';

export interface GenerateExamParams {
  subject: string;
  chapters: string[];
  difficulty: Difficulty;
  count: number;
  board: BoardType;
  class: number;
}

export interface AttemptForInsights {
  subject: string;
  scorePercent: number;
  questionResults: { chapter?: string; isCorrect: boolean }[];
}

export class ExamService {
  constructor(private readonly ai: AiClient) {}

  async generateExam(params: GenerateExamParams): Promise<GeneratedQuestion[]> {
    const result = await this.ai.completeJson<{ questions: GeneratedQuestion[] }>({
      system:
        'You are an experienced Indian school examiner. Generate accurate, ' +
        'curriculum-aligned questions with exactly one correct answer for MCQs.',
      messages: [
        {
          role: 'user',
          content:
            `Generate ${params.count} ${params.difficulty} questions for:\n` +
            `Board: ${params.board}, Class: ${params.class}, Subject: ${params.subject}\n` +
            `Chapters:\n${bulletList(params.chapters)}\n\n` +
            'Mix MCQ and SHORT types. Return JSON: { "questions": [{ "text": string, ' +
            '"type": "MCQ"|"SHORT"|"LONG", "difficulty": "EASY"|"MEDIUM"|"HARD", ' +
            '"options": string[] (4 options for MCQ, omit otherwise), ' +
            '"correctAnswer": string, "explanation": string }] }.',
        },
      ],
      maxTokens: 4000,
      feature: 'exam.generate',
    });
    return result.questions ?? [];
  }

  async evaluateAnswer(
    question: string,
    studentAnswer: string,
    maxMarks: number,
    referenceAnswer?: string,
  ): Promise<AnswerEvaluation> {
    return this.ai.completeJson<AnswerEvaluation>({
      system: 'You are a fair examiner grading a student\'s written answer.',
      messages: [
        {
          role: 'user',
          content:
            `Question: ${question}\n` +
            (referenceAnswer ? `Reference answer: ${referenceAnswer}\n` : '') +
            `Student answer: ${studentAnswer}\nMaximum marks: ${maxMarks}\n\n` +
            'Grade the answer. Return JSON: { "isCorrect": boolean, "score": number ' +
            `(0 to ${maxMarks}), "feedback": string }.`,
        },
      ],
      feature: 'exam.evaluate',
    });
  }

  async generateExamInsights(attempt: AttemptForInsights): Promise<ExamInsightDto> {
    const wrongByChapter = attempt.questionResults
      .filter((q) => !q.isCorrect)
      .map((q) => q.chapter ?? 'General');

    return this.ai.completeJson<ExamInsightDto>({
      messages: [
        {
          role: 'user',
          content:
            `A student scored ${attempt.scorePercent}% in ${attempt.subject}.\n` +
            `Chapters with mistakes: ${wrongByChapter.join(', ') || 'none'}.\n\n` +
            'Return JSON: { "summary": string, "weakAreas": string[], ' +
            '"recommendations": string[], "nextSteps": string[] }. Be encouraging.',
        },
      ],
      feature: 'exam.insights',
    });
  }
}
