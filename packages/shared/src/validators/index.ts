import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const phoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long');

const boardSchema = z.enum(['CBSE', 'ICSE', 'STATE']);
const moodSchema = z.enum(['VERY_SAD', 'SAD', 'NEUTRAL', 'HAPPY', 'VERY_HAPPY']);
const mealTypeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);
const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const CreateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: phoneSchema.optional(),
  password: passwordSchema.optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.enum(['STUDENT', 'PARENT', 'ADMIN']).default('PARENT'),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1).max(120),
  role: z.enum(['STUDENT', 'PARENT']).default('PARENT'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const SendOtpSchema = z.object({
  phone: phoneSchema,
});

export const OtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});

// ---------------------------------------------------------------------------
// Student profile
// ---------------------------------------------------------------------------

export const CreateStudentProfileSchema = z.object({
  familyId: z.string().cuid(),
  name: z.string().min(1).max(120),
  dateOfBirth: z.coerce.date().optional(),
  class: z.number().int().min(1).max(12),
  board: boardSchema,
  state: z.string().max(80).optional(),
  school: z.string().max(160).optional(),
});

export const UpdateStudentProfileSchema = CreateStudentProfileSchema.partial().omit({
  familyId: true,
});

export const LogStudySessionSchema = z.object({
  studentId: z.string().cuid(),
  subjectId: z.string().cuid(),
  chapterId: z.string().cuid().optional(),
  durationMinutes: z.number().int().min(1).max(720),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export const CreateExamSchema = z.object({
  title: z.string().min(1).max(160),
  subjectId: z.string().cuid(),
  isPublic: z.boolean().default(false),
  timeLimit: z.number().int().min(1).max(360).optional(),
  questionIds: z.array(z.string().cuid()).min(1).optional(),
});

export const GenerateExamSchema = z.object({
  subjectId: z.string().cuid(),
  chapterIds: z.array(z.string().cuid()).min(1),
  difficulty: difficultySchema,
  count: z.number().int().min(1).max(50).default(10),
});

export const SubmitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  selectedAnswer: z.string().max(5000),
});

export const SubmitExamSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid(),
        selectedAnswer: z.string().max(5000),
      }),
    )
    .min(1),
});

export const CreateChallengeSchema = z.object({
  challengedStudentId: z.string().cuid(),
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export const FoodItemSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.string().max(60).optional(),
  calories: z.number().int().min(0).max(5000).optional(),
  isJunk: z.boolean().optional(),
});

export const LogFoodSchema = z.object({
  studentId: z.string().cuid(),
  date: z.coerce.date().default(() => new Date()),
  mealType: mealTypeSchema,
  items: z.array(FoodItemSchema).min(1),
  calories: z.number().int().min(0).max(10000).optional(),
  isJunkFood: z.boolean().optional(),
  photoUrl: z.string().url().optional(),
});

export const LogActivitySchema = z.object({
  studentId: z.string().cuid(),
  date: z.coerce.date().default(() => new Date()),
  activityType: z.string().min(1).max(60),
  durationMinutes: z.number().int().min(1).max(600),
  calories: z.number().int().min(0).max(5000).optional(),
  notes: z.string().max(500).optional(),
});

export const LogSleepSchema = z.object({
  studentId: z.string().cuid(),
  date: z.coerce.date().default(() => new Date()),
  bedTime: z.coerce.date().optional(),
  wakeTime: z.coerce.date().optional(),
  hoursSlept: z.number().min(0).max(24),
  quality: z.enum(['POOR', 'FAIR', 'GOOD', 'EXCELLENT']).default('FAIR'),
});

export const LogMoodSchema = z.object({
  studentId: z.string().cuid(),
  date: z.coerce.date().default(() => new Date()),
  mood: moodSchema,
  notes: z.string().max(1000).optional(),
  isPrivate: z.boolean().default(true),
});

export const LogStressReliefSchema = z.object({
  studentId: z.string().cuid(),
  sessionType: z.enum(['BREATHING', 'JOURNAL', 'BRAIN_BREAK', 'MEDITATION']),
  durationMinutes: z.number().int().min(1).max(120),
});

export const LogParentMoodSchema = z.object({
  date: z.coerce.date().default(() => new Date()),
  mood: moodSchema,
  notes: z.string().max(1000).optional(),
});

export const ParentJournalSchema = z.object({
  content: z.string().min(1).max(5000),
});

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const CreateExpenseSchema = z.object({
  familyId: z.string().cuid(),
  studentId: z.string().cuid().optional(),
  categoryId: z.string().cuid(),
  amount: z.number().positive().max(10_000_000),
  description: z.string().max(280).optional(),
  date: z.coerce.date().default(() => new Date()),
  isJunkFood: z.boolean().default(false),
  receiptUrl: z.string().url().optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial().omit({ familyId: true });

export const CreateBudgetSchema = z.object({
  familyId: z.string().cuid(),
  categoryId: z.string().cuid(),
  monthlyLimit: z.number().positive().max(10_000_000),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const GivePocketMoneySchema = z.object({
  studentId: z.string().cuid(),
  amount: z.number().positive().max(1_000_000),
});

export const PocketMoneySpendSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  description: z.string().max(280).optional(),
});

// ---------------------------------------------------------------------------
// Family life
// ---------------------------------------------------------------------------

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  type: z.enum(['EXAM', 'VACATION', 'OUTING', 'DINNER', 'ACTIVITY', 'OTHER']).default('OTHER'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().default(false),
});

export const CreateVacationPlanSchema = z
  .object({
    destination: z.string().min(1).max(160),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    budget: z.number().positive().optional(),
    itinerary: z.unknown().optional(),
    status: z.enum(['PLANNED', 'BOOKED', 'COMPLETED']).default('PLANNED'),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const CreateOutingPlanSchema = z.object({
  destination: z.string().min(1).max(160),
  date: z.coerce.date(),
  budget: z.number().positive().optional(),
  educationalTags: z.array(z.string().max(40)).optional(),
  notes: z.string().max(1000).optional(),
});

export const CreateDinnerPlanSchema = z.object({
  date: z.coerce.date(),
  type: z.enum(['HOME', 'RESTAURANT']).default('HOME'),
  mealPlan: z.unknown().optional(),
  restaurantName: z.string().max(160).optional(),
  estimatedCost: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// AI requests
// ---------------------------------------------------------------------------

export const AskTutorSchema = z.object({
  studentId: z.string().cuid(),
  subjectId: z.string().cuid().optional(),
  chapterId: z.string().cuid().optional(),
  conversationId: z.string().cuid().optional(),
  question: z.string().min(1).max(4000),
});

export const SuggestVacationSchema = z.object({
  familyId: z.string().cuid(),
  budget: z.number().positive(),
  season: z.string().max(40).optional(),
  interests: z.array(z.string().max(40)).optional(),
});

export const SuggestOutingSchema = z.object({
  familyId: z.string().cuid(),
  location: z.string().min(1).max(120),
});

export const SuggestDinnerSchema = z.object({
  familyId: z.string().cuid(),
  preferences: z.array(z.string().max(40)).optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type OtpInput = z.infer<typeof OtpSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type CreateStudentProfileInput = z.infer<typeof CreateStudentProfileSchema>;
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;
export type LogStudySessionInput = z.infer<typeof LogStudySessionSchema>;
export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type GenerateExamInput = z.infer<typeof GenerateExamSchema>;
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
export type SubmitExamInput = z.infer<typeof SubmitExamSchema>;
export type CreateChallengeInput = z.infer<typeof CreateChallengeSchema>;
export type LogFoodInput = z.infer<typeof LogFoodSchema>;
export type LogActivityInput = z.infer<typeof LogActivitySchema>;
export type LogSleepInput = z.infer<typeof LogSleepSchema>;
export type LogMoodInput = z.infer<typeof LogMoodSchema>;
export type LogStressReliefInput = z.infer<typeof LogStressReliefSchema>;
export type LogParentMoodInput = z.infer<typeof LogParentMoodSchema>;
export type ParentJournalInput = z.infer<typeof ParentJournalSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
export type GivePocketMoneyInput = z.infer<typeof GivePocketMoneySchema>;
export type PocketMoneySpendInput = z.infer<typeof PocketMoneySpendSchema>;
export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;
export type CreateVacationPlanInput = z.infer<typeof CreateVacationPlanSchema>;
export type CreateOutingPlanInput = z.infer<typeof CreateOutingPlanSchema>;
export type CreateDinnerPlanInput = z.infer<typeof CreateDinnerPlanSchema>;
export type AskTutorInput = z.infer<typeof AskTutorSchema>;
export type SuggestVacationInput = z.infer<typeof SuggestVacationSchema>;
export type SuggestOutingInput = z.infer<typeof SuggestOutingSchema>;
export type SuggestDinnerInput = z.infer<typeof SuggestDinnerSchema>;
