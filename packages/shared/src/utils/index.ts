import type {
  FoodItem,
  FoodLogDto,
  StudySessionDto,
  WeeklyReportDto,
} from '../types';

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export type DateFormat = 'short' | 'long' | 'time' | 'datetime' | 'weekday';

export function formatDate(date: Date | string, format: DateFormat = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';

  const options: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' },
    weekday: { weekday: 'long', day: 'numeric', month: 'short' },
  };

  return new Intl.DateTimeFormat('en-IN', options[format]).format(d);
}

export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(age, 0);
}

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

/**
 * Returns the Monday–Sunday week range that contains `date`, normalised to
 * start/end of day. Indian week convention (Monday start).
 */
export function getWeekRange(date: Date | string = new Date()): { start: Date; end: Date } {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function dateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Health helpers
// ---------------------------------------------------------------------------

const JUNK_FOOD_KEYWORDS = [
  'chips',
  'soda',
  'cola',
  'pizza',
  'burger',
  'fries',
  'candy',
  'chocolate',
  'ice cream',
  'icecream',
  'noodles',
  'maggi',
  'samosa',
  'cake',
  'pastry',
  'donut',
  'doughnut',
  'fried',
  'sugary',
  'soft drink',
  'cold drink',
];

export function isJunkFood(foodItems: FoodItem[]): boolean {
  return foodItems.some((item) => {
    if (item.isJunk) return true;
    const name = item.name.toLowerCase();
    return JUNK_FOOD_KEYWORDS.some((kw) => name.includes(kw));
  });
}

/**
 * Nutrition score 0–100. Starts at 100 and is penalised for the proportion of
 * junk meals over the period. A perfectly clean diet scores 100.
 */
export function calculateNutritionScore(foodLogs: FoodLogDto[]): number {
  if (foodLogs.length === 0) return 100;
  const junkCount = foodLogs.filter(
    (log) => log.isJunkFood || isJunkFood(log.items),
  ).length;
  const junkRatio = junkCount / foodLogs.length;
  const score = Math.round(100 - junkRatio * 70);
  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// Study streak
// ---------------------------------------------------------------------------

/**
 * Calculates the current consecutive-day study streak counting back from today.
 * A day counts if it has at least one study session.
 */
export function calculateStudyStreak(studySessions: StudySessionDto[]): number {
  if (studySessions.length === 0) return 0;

  const studiedDays = new Set(studySessions.map((s) => dateKey(s.date)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Allow the streak to count from today or yesterday so a not-yet-studied
  // "today" doesn't immediately break an active streak.
  if (!studiedDays.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!studiedDays.has(dateKey(cursor))) return 0;
  }

  while (studiedDays.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ---------------------------------------------------------------------------
// Weekly report aggregation (pure data shaping; AI narrative added elsewhere)
// ---------------------------------------------------------------------------

export interface WeeklyReportInput {
  familyId: string;
  studentId?: string | null;
  weekStart: Date | string;
  weekEnd: Date | string;
  academicData?: Record<string, unknown>;
  healthData?: Record<string, unknown>;
  financeData?: Record<string, unknown>;
  talentData?: Record<string, unknown>;
  narrative?: string;
}

export function generateWeeklyReport(input: WeeklyReportInput): Omit<WeeklyReportDto, 'id'> {
  return {
    familyId: input.familyId,
    studentId: input.studentId ?? null,
    weekStart: new Date(input.weekStart).toISOString(),
    weekEnd: new Date(input.weekEnd).toISOString(),
    academicData: input.academicData ?? null,
    healthData: input.healthData ?? null,
    financeData: input.financeData ?? null,
    talentData: input.talentData ?? null,
    narrative: input.narrative ?? null,
  };
}

// ---------------------------------------------------------------------------
// Text + control-flow utilities
// ---------------------------------------------------------------------------

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), waitMs);
  };
}

export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  limitMs: number,
): (...args: Args) => void {
  let inThrottle = false;
  let lastArgs: Args | null = null;
  return (...args: Args) => {
    if (inThrottle) {
      lastArgs = args;
      return;
    }
    fn(...args);
    inThrottle = true;
    setTimeout(() => {
      inThrottle = false;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, limitMs);
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function percentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}
