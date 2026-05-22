import type { AiClient } from '../client';
import { bulletList } from '../utils/prompt-builder';
import type { Activity, Destination, MealPlan, Outing } from '../types';

export interface VacationParams {
  budget: number;
  season?: string;
  interests?: string[];
  origin?: string;
}

export interface OutingParams {
  location: string;
  childClasses: number[];
  subjects?: string[];
}

export class FamilyService {
  constructor(private readonly ai: AiClient) {}

  async suggestVacationDestinations(params: VacationParams): Promise<Destination[]> {
    const result = await this.ai.completeJson<{ destinations: Destination[] }>({
      system: 'You are a family travel planner specialising in Indian destinations.',
      messages: [
        {
          role: 'user',
          content:
            `Suggest 3 family vacation destinations in India.\nBudget: ₹${params.budget}\n` +
            (params.season ? `Season: ${params.season}\n` : '') +
            (params.interests?.length ? `Interests: ${params.interests.join(', ')}\n` : '') +
            '\nReturn JSON: { "destinations": [{ "name": string, "description": string, ' +
            '"estimatedCost": number, "highlights": string[], "educationalValue": string }] }.',
        },
      ],
      maxTokens: 1500,
      feature: 'family.vacation',
    });
    return result.destinations ?? [];
  }

  async suggestOutings(params: OutingParams): Promise<Outing[]> {
    const result = await this.ai.completeJson<{ outings: Outing[] }>({
      messages: [
        {
          role: 'user',
          content:
            `Suggest 3 educational day-outing ideas near ${params.location} suitable for ` +
            `children in classes ${params.childClasses.join(', ')}.` +
            (params.subjects?.length ? ` Tie-ins to: ${params.subjects.join(', ')}.` : '') +
            '\n\nReturn JSON: { "outings": [{ "name": string, "description": string, ' +
            '"educationalTags": string[], "estimatedCost": number }] }.',
        },
      ],
      maxTokens: 1200,
      feature: 'family.outing',
    });
    return result.outings ?? [];
  }

  async suggestDinnerPlan(
    nutritionContext: string,
    preferences: string[] = [],
  ): Promise<MealPlan> {
    return this.ai.completeJson<MealPlan>({
      messages: [
        {
          role: 'user',
          content:
            `Suggest a balanced Indian family dinner.\nNutrition context: ${nutritionContext}\n` +
            (preferences.length ? `Preferences: ${preferences.join(', ')}\n` : '') +
            '\nReturn JSON: { "title": string, "items": string[], "estimatedCalories": number, ' +
            '"notes": string }.',
        },
      ],
      feature: 'family.dinner',
    });
  }

  async generateFamilyBondingActivity(familyContext: string): Promise<Activity[]> {
    const result = await this.ai.completeJson<{ activities: Activity[] }>({
      messages: [
        {
          role: 'user',
          content:
            `Suggest 3 simple at-home family bonding activities for an Indian family.\n` +
            `Context: ${familyContext}\n\nReturn JSON: { "activities": [{ "title": string, ` +
            '"description": string, "durationMinutes": number }] }.',
        },
      ],
      feature: 'family.bonding',
    });
    return result.activities ?? [];
  }

  /** Convenience: render a list of destinations as plain text. */
  static renderDestinations(destinations: Destination[]): string {
    return bulletList(destinations.map((d) => `${d.name} (~₹${d.estimatedCost}): ${d.description}`));
  }
}
