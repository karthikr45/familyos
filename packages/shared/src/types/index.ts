// Plain, frontend-safe DTO types mirroring the Prisma models.
// These intentionally avoid Prisma's generated types so they can be imported
// by web and mobile without pulling in the Prisma client.

// ---------------------------------------------------------------------------
// Enums (string-literal unions — safe across web/native/server)
// ---------------------------------------------------------------------------

export type UserRole = 'STUDENT' | 'PARENT' | 'ADMIN';
export type FamilyRole = 'PARENT' | 'CHILD';
export type BoardType = 'CBSE' | 'ICSE' | 'STATE';
export type QuestionType = 'MCQ' | 'SHORT' | 'LONG';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ContentSource = 'AI' | 'MANUAL';
export type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type LoggedByRole = 'STUDENT' | 'PARENT';
export type SleepQuality = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
export type MoodLevel = 'VERY_SAD' | 'SAD' | 'NEUTRAL' | 'HAPPY' | 'VERY_HAPPY';
export type StressSessionType = 'BREATHING' | 'JOURNAL' | 'BRAIN_BREAK' | 'MEDITATION';
export type TalentType = 'SPORTS' | 'ARTS' | 'MUSIC' | 'CODING' | 'ACADEMIC' | 'OTHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';
export type CalendarEventType = 'EXAM' | 'VACATION' | 'OUTING' | 'DINNER' | 'ACTIVITY' | 'OTHER';
export type VacationStatus = 'PLANNED' | 'BOOKED' | 'COMPLETED';
export type DinnerType = 'HOME' | 'RESTAURANT';
export type AiMessageRole = 'USER' | 'ASSISTANT';

// Dates cross the wire as ISO strings.
export type ISODateString = string;

// ---------------------------------------------------------------------------
// Generic API envelope + pagination
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Users & family
// ---------------------------------------------------------------------------

export interface UserDto {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  createdAt: ISODateString;
}

export interface StudentProfileDto {
  id: string;
  userId: string;
  familyId: string;
  name: string;
  dateOfBirth: ISODateString | null;
  class: number;
  board: BoardType;
  state: string | null;
  school: string | null;
  avatarUrl: string | null;
}

export interface ParentProfileDto {
  id: string;
  userId: string;
  familyId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface FamilyDto {
  id: string;
  name: string;
  members: FamilyMemberDto[];
  createdAt: ISODateString;
}

export interface FamilyMemberDto {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyRole;
  name: string | null;
}

// ---------------------------------------------------------------------------
// Academics
// ---------------------------------------------------------------------------

export interface SubjectDto {
  id: string;
  boardId: string;
  class: number;
  name: string;
  code: string;
}

export interface ChapterDto {
  id: string;
  subjectId: string;
  name: string;
  number: number;
  description: string | null;
  isCompleted: boolean;
}

export interface StudySessionDto {
  id: string;
  studentId: string;
  subjectId: string;
  chapterId: string | null;
  durationMinutes: number;
  date: ISODateString;
  notes: string | null;
}

export interface WeakAreaDto {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName?: string;
  chapterId: string | null;
  chapterName?: string;
  score: number;
  lastDetectedAt: ISODateString;
}

export interface StudyStreakDto {
  current: number;
  longest: number;
  lastStudiedDate: ISODateString | null;
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export interface QuestionDto {
  id: string;
  subjectId: string;
  chapterId: string | null;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  options: string[] | null;
  correctAnswer: string | null;
  explanation: string | null;
  createdBy: ContentSource;
}

export interface ExamDto {
  id: string;
  title: string;
  creatorId: string;
  subjectId: string;
  isPublic: boolean;
  isAiGenerated: boolean;
  timeLimit: number | null;
  totalMarks: number;
  questionCount?: number;
  createdAt: ISODateString;
}

export interface ExamAttemptDto {
  id: string;
  examId: string;
  studentId: string;
  startedAt: ISODateString;
  completedAt: ISODateString | null;
  score: number;
  totalMarks: number;
  timeTaken: number | null;
}

export interface ExamAnswerResultDto {
  questionId: string;
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  marksAwarded: number;
  explanation: string | null;
}

export interface ExamResultDto {
  attempt: ExamAttemptDto;
  answers: ExamAnswerResultDto[];
  percentage: number;
  insights?: ExamInsightDto;
}

export interface ExamInsightDto {
  summary: string;
  weakAreas: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface PeerChallengeDto {
  id: string;
  examId: string;
  examTitle?: string;
  challengerId: string;
  challengedId: string;
  status: ChallengeStatus;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface FoodItem {
  name: string;
  quantity?: string;
  calories?: number;
  isJunk?: boolean;
}

export interface FoodLogDto {
  id: string;
  studentId: string;
  date: ISODateString;
  mealType: MealType;
  items: FoodItem[];
  calories: number | null;
  isJunkFood: boolean;
  photoUrl: string | null;
  loggedBy: LoggedByRole;
}

export interface ActivityLogDto {
  id: string;
  studentId: string;
  date: ISODateString;
  activityType: string;
  durationMinutes: number;
  calories: number | null;
  notes: string | null;
}

export interface SleepLogDto {
  id: string;
  studentId: string;
  date: ISODateString;
  bedTime: ISODateString | null;
  wakeTime: ISODateString | null;
  hoursSlept: number;
  quality: SleepQuality;
}

export interface MoodLogDto {
  id: string;
  studentId: string;
  date: ISODateString;
  mood: MoodLevel;
  notes: string | null;
  isPrivate: boolean;
}

export interface MoodTrendDto {
  // Aggregated trend only — never exposes raw private notes to parents.
  points: { date: ISODateString; averageMood: number }[];
  dominantMood: MoodLevel;
}

export interface NutritionScoreDto {
  score: number;
  junkFoodCount: number;
  suggestions: string[];
}

export interface HealthSummaryDto {
  studentId: string;
  weekStart: ISODateString;
  weekEnd: ISODateString;
  nutritionScore: number;
  activeDays: number;
  averageSleepHours: number;
  moodTrend: MoodTrendDto;
  junkFoodCount: number;
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface ExpenseDto {
  id: string;
  familyId: string;
  studentId: string | null;
  categoryId: string;
  categoryName?: string;
  amount: number;
  description: string | null;
  date: ISODateString;
  isJunkFood: boolean;
  receiptUrl: string | null;
}

export interface BudgetDto {
  id: string;
  familyId: string;
  categoryId: string;
  categoryName?: string;
  monthlyLimit: number;
  month: number;
  year: number;
  spent?: number;
}

export interface CategoryBreakdownDto {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

export interface FinanceSummaryDto {
  totalSpent: number;
  month: number;
  year: number;
  byCategory: CategoryBreakdownDto[];
  junkFoodSpend: number;
  budgetTotal: number;
}

export interface PocketMoneyDto {
  id: string;
  studentId: string;
  amount: number;
  givenAt: ISODateString;
  balance?: number;
}

// ---------------------------------------------------------------------------
// Talents & tuitions
// ---------------------------------------------------------------------------

export interface TalentDto {
  id: string;
  studentId: string;
  talentCategoryId: string;
  categoryName?: string;
  name: string;
  coach: string | null;
  venue: string | null;
  startedAt: ISODateString | null;
  totalPracticeMinutes?: number;
}

export interface AchievementDto {
  id: string;
  studentTalentId: string;
  title: string;
  description: string | null;
  date: ISODateString;
  certificateUrl: string | null;
}

export interface TuitionDto {
  id: string;
  studentId: string;
  subjectId: string | null;
  tutorName: string;
  tutorPhone: string | null;
  venue: string | null;
  feesPerMonth: number;
  schedule: Record<string, unknown> | null;
  startedAt: ISODateString | null;
  attendancePercentage?: number;
  lastPaymentStatus?: PaymentStatus;
  effectivenessScore?: number;
}

// ---------------------------------------------------------------------------
// Family life
// ---------------------------------------------------------------------------

export interface CalendarEventDto {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  startDate: ISODateString;
  endDate: ISODateString | null;
  allDay: boolean;
}

export interface VacationPlanDto {
  id: string;
  familyId: string;
  destination: string;
  startDate: ISODateString;
  endDate: ISODateString;
  budget: number | null;
  itinerary: unknown | null;
  status: VacationStatus;
}

export interface OutingPlanDto {
  id: string;
  familyId: string;
  destination: string;
  date: ISODateString;
  budget: number | null;
  educationalTags: string[] | null;
  notes: string | null;
}

export interface DinnerPlanDto {
  id: string;
  familyId: string;
  date: ISODateString;
  type: DinnerType;
  mealPlan: unknown | null;
  restaurantName: string | null;
  estimatedCost: number | null;
}

// ---------------------------------------------------------------------------
// Notifications & reports
// ---------------------------------------------------------------------------

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: ISODateString;
}

export interface WeeklyReportDto {
  id: string;
  familyId: string;
  studentId: string | null;
  weekStart: ISODateString;
  weekEnd: ISODateString;
  academicData: Record<string, unknown> | null;
  healthData: Record<string, unknown> | null;
  financeData: Record<string, unknown> | null;
  talentData: Record<string, unknown> | null;
  narrative: string | null;
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export interface AiMessageDto {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  createdAt: ISODateString;
}

export interface AiConversationDto {
  id: string;
  studentId: string;
  subject: string | null;
  createdAt: ISODateString;
  messages?: AiMessageDto[];
}

// ---------------------------------------------------------------------------
// Weather (weatherapi.com)
// ---------------------------------------------------------------------------

export interface WeatherLocationDto {
  name: string;
  region: string;
  country: string;
  localtime: ISODateString;
  lat?: number;
  lon?: number;
  tzId?: string;
}

export interface WeatherConditionDto {
  text: string;
  icon: string;
  code: number;
}

export interface AstroDto {
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  moonPhase: string;
  moonIllumination: number;
  isSunUp?: boolean;
  isMoonUp?: boolean;
}

export interface HourlyWeatherDto {
  time: ISODateString;
  tempC: number;
  feelsLikeC: number;
  condition: WeatherConditionDto;
  chanceOfRain: number;
  windKph: number;
  humidity: number;
  isDay: boolean;
}

export interface CurrentWeatherDto {
  location: WeatherLocationDto;
  tempC: number;
  feelsLikeC: number;
  condition: WeatherConditionDto;
  humidity: number;
  windKph: number;
  windDir: string;
  precipMm: number;
  pressureMb: number;
  visKm: number;
  cloud: number;
  uv: number;
  gustKph: number;
  isDay: boolean;
  lastUpdated: ISODateString;
}

export interface ForecastDayDto {
  date: ISODateString;
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  condition: WeatherConditionDto;
  chanceOfRain: number;
  maxWindKph: number;
  totalPrecipMm: number;
  avgHumidity: number;
  uv: number;
  astro?: AstroDto;
  hours?: HourlyWeatherDto[];
}

export interface WeatherAlertDto {
  headline: string;
  severity: string;
  urgency: string;
  event: string;
  areas: string;
  effective: ISODateString;
  expires: ISODateString;
  description: string;
  instruction: string;
}

export interface WeatherForecastDto {
  location: WeatherLocationDto;
  current: CurrentWeatherDto;
  forecast: ForecastDayDto[];
  alerts: WeatherAlertDto[];
}

export interface AstronomyDto {
  location: WeatherLocationDto;
  astro: AstroDto;
}

export interface TideDto {
  time: ISODateString;
  heightMt: number;
  type: string;
}

export interface MarineHourDto {
  time: ISODateString;
  sigHeightMt: number;
  swellHeightMt: number;
  swellPeriodSecs: number;
  waterTempC: number;
  windKph: number;
}

export interface MarineDayDto {
  date: ISODateString;
  maxTempC: number;
  minTempC: number;
  condition: WeatherConditionDto;
  tides: TideDto[];
  hours: MarineHourDto[];
}

export interface MarineForecastDto {
  location: WeatherLocationDto;
  days: MarineDayDto[];
}

export interface LocationSearchResultDto {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

export interface SportsEventDto {
  stadium: string;
  country: string;
  region: string;
  tournament: string;
  start: ISODateString;
  match: string;
}

export interface SportsDto {
  football: SportsEventDto[];
  cricket: SportsEventDto[];
  golf: SportsEventDto[];
}

export interface TimezoneDto {
  name: string;
  region: string;
  country: string;
  tzId: string;
  localtime: ISODateString;
}

export interface IpLookupDto {
  ip: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tzId: string;
}

export interface WeatherOverviewDto {
  location: WeatherLocationDto;
  current: CurrentWeatherDto;
  forecast: ForecastDayDto[];
  alerts: WeatherAlertDto[];
  sports: SportsDto;
}
