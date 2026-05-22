import type { StudentProfileDto } from '@familyos/shared';
import type { AiClient } from '../client';
import { bulletList, tutorSystemPrompt } from '../utils/prompt-builder';
import type { ChatMessage, StudyPlanDto } from '../types';

export interface UpcomingExam {
  title: string;
  subject: string;
  date: string;
}

export interface WeakAreaInput {
  subject: string;
  chapter?: string;
  score: number;
}

export interface AttemptSummary {
  subject: string;
  chapter?: string;
  scorePercent: number;
}

export interface DetectedWeakArea {
  subject: string;
  chapter?: string;
  score: number;
  reason: string;
}

export class TutorService {
  constructor(private readonly ai: AiClient) {}

  /** Streams an answer from the AI tutor for the student's question. */
  askTutor(
    profile: StudentProfileDto,
    subject: string | undefined,
    chapter: string | undefined,
    question: string,
    history: ChatMessage[] = [],
  ): AsyncGenerator<string, void, unknown> {
    const messages: ChatMessage[] = [...history, { role: 'user', content: question }];
    return this.ai.stream({
      system: tutorSystemPrompt(profile, subject, chapter),
      messages,
      maxTokens: 1500,
      temperature: 0.6,
      feature: 'tutor.ask',
    });
  }

  async generateStudyPlan(
    profile: StudentProfileDto,
    weakAreas: WeakAreaInput[],
    upcomingExams: UpcomingExam[],
  ): Promise<StudyPlanDto> {
    const context = [
      `Student class ${profile.class}, board ${profile.board}.`,
      weakAreas.length
        ? `Weak areas:\n${bulletList(
            weakAreas.map((w) => `${w.subject}${w.chapter ? ` - ${w.chapter}` : ''} (${w.score}%)`),
          )}`
        : 'No specific weak areas recorded.',
      upcomingExams.length
        ? `Upcoming exams:\n${bulletList(
            upcomingExams.map((e) => `${e.subject}: ${e.title} on ${e.date}`),
          )}`
        : 'No upcoming exams.',
    ].join('\n\n');

    return this.ai.completeJson<StudyPlanDto>({
      system: tutorSystemPrompt(profile),
      messages: [
        {
          role: 'user',
          content:
            `Create a focused 7-day study plan for this student.\n\n${context}\n\n` +
            'Return JSON: { "summary": string, "days": [{ "day": string, "focus": string, ' +
            '"tasks": string[], "estimatedMinutes": number }], "tips": string[] }. ' +
            'Keep daily study realistic for the student\'s age.',
        },
      ],
      maxTokens: 2000,
      feature: 'tutor.studyPlan',
    });
  }

  async detectWeakAreas(attempts: AttemptSummary[]): Promise<DetectedWeakArea[]> {
    if (attempts.length === 0) return [];
    return this.ai.completeJson<DetectedWeakArea[]>({
      messages: [
        {
          role: 'user',
          content:
            'Given these exam attempt results, identify the weak areas needing attention. ' +
            'A score below 60% indicates weakness.\n\n' +
            bulletList(
              attempts.map(
                (a) => `${a.subject}${a.chapter ? ` - ${a.chapter}` : ''}: ${a.scorePercent}%`,
              ),
            ) +
            '\n\nReturn JSON array: [{ "subject": string, "chapter": string, "score": number, ' +
            '"reason": string }].',
        },
      ],
      feature: 'tutor.detectWeakAreas',
    });
  }

  async generateExplanation(
    question: string,
    wrongAnswer: string,
    correctAnswer: string,
  ): Promise<string> {
    const { text } = await this.ai.complete({
      messages: [
        {
          role: 'user',
          content:
            `A student answered a question incorrectly.\n\nQuestion: ${question}\n` +
            `Their answer: ${wrongAnswer}\nCorrect answer: ${correctAnswer}\n\n` +
            'Gently explain why the correct answer is right and where their thinking ' +
            'likely went wrong. Be encouraging and concise.',
        },
      ],
      maxTokens: 600,
      feature: 'tutor.explanation',
    });
    return text;
  }
}
