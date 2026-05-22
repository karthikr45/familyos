import type {
  Difficulty,
  ExamInsightDto,
  QuestionType,
  StudentProfileDto,
  WeakAreaDto,
} from '@familyos/shared';

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export type UsageHandler = (feature: string, usage: TokenUsage) => void | Promise<void>;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedQuestion {
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface StudyPlanDay {
  day: string;
  focus: string;
  tasks: string[];
  estimatedMinutes: number;
}

export interface StudyPlanDto {
  summary: string;
  days: StudyPlanDay[];
  tips: string[];
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  score: number; // 0..marks
  feedback: string;
}

export interface FoodAnalysis {
  nutritionScore: number;
  junkFoodCount: number;
  suggestions: string[];
}

export interface IdentifiedFoodItem {
  name: string;
  estimatedCalories: number;
  isJunk: boolean;
}

export interface StressAnalysisDto {
  stressDetected: boolean;
  level: 'LOW' | 'MODERATE' | 'HIGH';
  summary: string;
  parentingTip: string;
}

export interface WeeklyDigestDto {
  headline: string;
  academics: string;
  health: string;
  finance: string;
  talents: string;
  recommendation: string;
}

export interface Destination {
  name: string;
  description: string;
  estimatedCost: number;
  highlights: string[];
  educationalValue: string;
}

export interface Outing {
  name: string;
  description: string;
  educationalTags: string[];
  estimatedCost: number;
}

export interface MealPlan {
  title: string;
  items: string[];
  estimatedCalories: number;
  notes: string;
}

export interface Activity {
  title: string;
  description: string;
  durationMinutes: number;
}

export type { ExamInsightDto, StudentProfileDto, WeakAreaDto };
