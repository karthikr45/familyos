import type { NotificationDto, StudentProfileDto } from '@familyos/shared';
import type { AiClient } from '../client';
import { describeStudent } from '../utils/prompt-builder';
import type { WeeklyDigestDto } from '../types';

export interface WeeklyData {
  studyHours: number;
  averageExamScore: number;
  nutritionScore: number;
  activeDays: number;
  totalSpent: number;
  junkFoodSpend: number;
  talentPracticeHours: number;
  achievements: number;
}

export class ParentService {
  constructor(private readonly ai: AiClient) {}

  async generateParentingTip(
    profile: StudentProfileDto,
    weeklyData: WeeklyData,
  ): Promise<string> {
    const { text } = await this.ai.complete({
      messages: [
        {
          role: 'user',
          content:
            `Give one short, actionable, supportive parenting tip for this week.\n` +
            `${describeStudent(profile)}\n` +
            `Study hours: ${weeklyData.studyHours}, avg exam score: ${weeklyData.averageExamScore}%, ` +
            `nutrition: ${weeklyData.nutritionScore}/100, active days: ${weeklyData.activeDays}.\n` +
            'One paragraph, warm tone, India-aware.',
        },
      ],
      maxTokens: 300,
      feature: 'parent.tip',
    });
    return text;
  }

  async generateWeeklyDigest(
    familyName: string,
    studentName: string,
    weeklyData: WeeklyData,
  ): Promise<WeeklyDigestDto> {
    return this.ai.completeJson<WeeklyDigestDto>({
      messages: [
        {
          role: 'user',
          content:
            `Write a warm weekly family digest for ${familyName} about ${studentName}.\n` +
            `Data: study ${weeklyData.studyHours}h, avg exam ${weeklyData.averageExamScore}%, ` +
            `nutrition ${weeklyData.nutritionScore}/100, active ${weeklyData.activeDays} days, ` +
            `spent ₹${weeklyData.totalSpent} (junk ₹${weeklyData.junkFoodSpend}), ` +
            `talent practice ${weeklyData.talentPracticeHours}h, ${weeklyData.achievements} achievements.\n\n` +
            'Return JSON: { "headline": string, "academics": string, "health": string, ' +
            '"finance": string, "talents": string, "recommendation": string }. ' +
            'Each field is 1-2 sentences. Celebrate wins; flag concerns gently.',
        },
      ],
      maxTokens: 1200,
      feature: 'parent.weeklyDigest',
    });
  }

  async generateFinanceInsight(
    totalSpent: number,
    budgetTotal: number,
    junkFoodSpend: number,
    topCategory: string,
  ): Promise<string> {
    const { text } = await this.ai.complete({
      messages: [
        {
          role: 'user',
          content:
            `Family spent ₹${totalSpent} against a budget of ₹${budgetTotal} this month. ` +
            `Top category: ${topCategory}. Junk food spend: ₹${junkFoodSpend}.\n` +
            'Give one concise, practical money insight for the family. India-aware.',
        },
      ],
      maxTokens: 300,
      feature: 'parent.financeInsight',
    });
    return text;
  }

  async generateAiAlert(
    userId: string,
    alertType: string,
    data: Record<string, unknown>,
  ): Promise<Omit<NotificationDto, 'id' | 'createdAt' | 'isRead'>> {
    const result = await this.ai.completeJson<{ title: string; body: string }>({
      messages: [
        {
          role: 'user',
          content:
            `Compose a short push notification for a parent.\nAlert type: ${alertType}\n` +
            `Context: ${JSON.stringify(data)}\n\n` +
            'Return JSON: { "title": string (max 50 chars), "body": string (max 140 chars) }. ' +
            'Be supportive, not alarming.',
        },
      ],
      feature: 'parent.alert',
    });

    return { userId, type: alertType, title: result.title, body: result.body, data };
  }
}
