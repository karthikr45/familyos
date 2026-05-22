import type { FoodLogDto, MoodLogDto } from '@familyos/shared';
import { calculateNutritionScore } from '@familyos/shared';
import type { AiClient } from '../client';
import { bulletList } from '../utils/prompt-builder';
import type { FoodAnalysis, IdentifiedFoodItem, StressAnalysisDto } from '../types';

export interface StudySessionSummary {
  date: string;
  durationMinutes: number;
}

export class HealthService {
  constructor(private readonly ai: AiClient) {}

  /**
   * Computes a deterministic nutrition score locally, then asks the AI only for
   * qualitative suggestions — cheaper and more consistent than scoring via LLM.
   */
  async analyzeFoodLog(foodLogs: FoodLogDto[]): Promise<FoodAnalysis> {
    const nutritionScore = calculateNutritionScore(foodLogs);
    const junkFoodCount = foodLogs.filter((l) => l.isJunkFood).length;

    if (foodLogs.length === 0) {
      return { nutritionScore, junkFoodCount, suggestions: ['Start logging meals to get insights.'] };
    }

    const meals = foodLogs
      .slice(-15)
      .map((l) => `${l.mealType}: ${l.items.map((i) => i.name).join(', ')}`);

    const result = await this.ai.completeJson<{ suggestions: string[] }>({
      messages: [
        {
          role: 'user',
          content:
            `A student's recent meals (nutrition score ${nutritionScore}/100, ` +
            `${junkFoodCount} junk meals):\n${bulletList(meals)}\n\n` +
            'Give 3 short, practical, India-friendly suggestions to improve their diet. ' +
            'Return JSON: { "suggestions": string[] }.',
        },
      ],
      feature: 'health.analyzeFood',
    });

    return { nutritionScore, junkFoodCount, suggestions: result.suggestions ?? [] };
  }

  async identifyFoodFromPhoto(imageBase64: string): Promise<IdentifiedFoodItem[]> {
    const { text } = await this.ai.analyzeImage(
      imageBase64,
      'Identify the food items in this photo of an Indian meal. For each item, give a name, ' +
        'estimated calories, and whether it is junk food. Respond with ONLY a JSON array: ' +
        '[{ "name": string, "estimatedCalories": number, "isJunk": boolean }].',
      'health.identifyFood',
    );
    try {
      const match = text.match(/\[[\s\S]*\]/);
      return match ? (JSON.parse(match[0]) as IdentifiedFoodItem[]) : [];
    } catch {
      return [];
    }
  }

  async detectStressPattern(
    moodLogs: MoodLogDto[],
    studySessions: StudySessionSummary[],
  ): Promise<StressAnalysisDto> {
    const moodSummary = moodLogs
      .slice(-14)
      .map((m) => `${m.date.slice(0, 10)}: ${m.mood}`);
    const totalStudy = studySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    return this.ai.completeJson<StressAnalysisDto>({
      messages: [
        {
          role: 'user',
          content:
            `Analyze this student's recent mood log and study load for stress signs.\n` +
            `Moods:\n${bulletList(moodSummary)}\n` +
            `Total study minutes (period): ${totalStudy}\n\n` +
            'Return JSON: { "stressDetected": boolean, "level": "LOW"|"MODERATE"|"HIGH", ' +
            '"summary": string, "parentingTip": string }. The tip is gentle advice for a parent.',
        },
      ],
      feature: 'health.stressPattern',
    });
  }

  async generateHealthInsights(data: {
    nutritionScore: number;
    activeDays: number;
    averageSleepHours: number;
    dominantMood: string;
  }): Promise<string> {
    const { text } = await this.ai.complete({
      messages: [
        {
          role: 'user',
          content:
            `Summarise this student's week of health data in 2-3 encouraging sentences ` +
            `for a parent.\nNutrition score: ${data.nutritionScore}/100\n` +
            `Active days: ${data.activeDays}/7\nAvg sleep: ${data.averageSleepHours}h\n` +
            `Dominant mood: ${data.dominantMood}`,
        },
      ],
      maxTokens: 400,
      feature: 'health.insights',
    });
    return text;
  }
}
