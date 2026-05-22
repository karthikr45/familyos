import type {
  BoardType,
  MealType,
  MoodLevel,
  TalentType,
} from '../types';

// ---------------------------------------------------------------------------
// Boards & classes
// ---------------------------------------------------------------------------

export const BOARDS: Record<BoardType, { label: string; description: string }> = {
  CBSE: { label: 'CBSE', description: 'Central Board of Secondary Education' },
  ICSE: { label: 'ICSE', description: 'Indian Certificate of Secondary Education' },
  STATE: { label: 'State Board', description: 'State Education Board' },
};

export const CLASSES: { value: number; label: string }[] = Array.from(
  { length: 12 },
  (_, i) => ({ value: i + 1, label: `Class ${i + 1}` }),
);

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export const MEAL_TYPES: Record<MealType, { label: string; icon: string }> = {
  BREAKFAST: { label: 'Breakfast', icon: 'sunrise' },
  LUNCH: { label: 'Lunch', icon: 'sun' },
  DINNER: { label: 'Dinner', icon: 'moon' },
  SNACK: { label: 'Snack', icon: 'cookie' },
};

export const ACTIVITY_TYPES: { value: string; label: string; icon: string }[] = [
  { value: 'WALKING', label: 'Walking', icon: 'footprints' },
  { value: 'RUNNING', label: 'Running', icon: 'activity' },
  { value: 'CYCLING', label: 'Cycling', icon: 'bike' },
  { value: 'SPORTS', label: 'Sports', icon: 'volleyball' },
  { value: 'YOGA', label: 'Yoga', icon: 'flower' },
  { value: 'GYM', label: 'Gym / Workout', icon: 'dumbbell' },
  { value: 'OTHER', label: 'Other', icon: 'circle' },
];

export const MOOD_TYPES: Record<MoodLevel, { label: string; emoji: string; value: number }> = {
  VERY_SAD: { label: 'Very Sad', emoji: '😢', value: 1 },
  SAD: { label: 'Sad', emoji: '🙁', value: 2 },
  NEUTRAL: { label: 'Neutral', emoji: '😐', value: 3 },
  HAPPY: { label: 'Happy', emoji: '🙂', value: 4 },
  VERY_HAPPY: { label: 'Very Happy', emoji: '😄', value: 5 },
};

export const TALENT_TYPES: Record<TalentType, { label: string; icon: string }> = {
  SPORTS: { label: 'Sports', icon: 'trophy' },
  ARTS: { label: 'Arts', icon: 'palette' },
  MUSIC: { label: 'Music', icon: 'music' },
  CODING: { label: 'Coding', icon: 'code' },
  ACADEMIC: { label: 'Academic', icon: 'book' },
  OTHER: { label: 'Other', icon: 'sparkles' },
};

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const EXPENSE_CATEGORIES: {
  key: string;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: 'EDUCATION', label: 'Education', icon: 'graduation-cap', color: '#4f46e5' },
  { key: 'TUITION', label: 'Tuition', icon: 'book-open', color: '#7c3aed' },
  { key: 'FOOD', label: 'Food & Groceries', icon: 'shopping-cart', color: '#16a34a' },
  { key: 'JUNK_FOOD', label: 'Junk Food', icon: 'pizza', color: '#dc2626' },
  { key: 'HEALTH', label: 'Health', icon: 'heart-pulse', color: '#0ea5e9' },
  { key: 'TRANSPORT', label: 'Transport', icon: 'bus', color: '#f59e0b' },
  { key: 'ENTERTAINMENT', label: 'Entertainment', icon: 'clapperboard', color: '#ec4899' },
  { key: 'TALENTS', label: 'Talents & Hobbies', icon: 'palette', color: '#8b5cf6' },
  { key: 'CLOTHING', label: 'Clothing', icon: 'shirt', color: '#14b8a6' },
  { key: 'TRAVEL', label: 'Travel & Vacation', icon: 'plane', color: '#06b6d4' },
  { key: 'POCKET_MONEY', label: 'Pocket Money', icon: 'wallet', color: '#84cc16' },
  { key: 'OTHER', label: 'Other', icon: 'ellipsis', color: '#6b7280' },
];

export const JUNK_FOOD_WEEKLY_THRESHOLD = 5;
export const JUNK_FOOD_SPEND_THRESHOLD = 1500; // INR per month

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES = {
  MORNING_REMINDER: 'MORNING_REMINDER',
  MIDDAY_REMINDER: 'MIDDAY_REMINDER',
  AFTERNOON_REMINDER: 'AFTERNOON_REMINDER',
  EVENING_REMINDER: 'EVENING_REMINDER',
  WEEKLY_DIGEST: 'WEEKLY_DIGEST',
  EXAM_REMINDER: 'EXAM_REMINDER',
  FEE_DUE_REMINDER: 'FEE_DUE_REMINDER',
  JUNK_FOOD_ALERT: 'JUNK_FOOD_ALERT',
  STRESS_ALERT: 'STRESS_ALERT',
  BUDGET_ALERT: 'BUDGET_ALERT',
  EXAM_SCORE: 'EXAM_SCORE',
  PEER_CHALLENGE: 'PEER_CHALLENGE',
  WEAK_AREA_DETECTED: 'WEAK_AREA_DETECTED',
  REPORT_READY: 'REPORT_READY',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const DAILY_NOTIFICATION_SCHEDULE = {
  MORNING: '07:00',
  MIDDAY: '12:30',
  AFTERNOON: '16:00',
  EVENING: '20:00',
} as const;

export const IST_TIMEZONE = 'Asia/Kolkata';

// ---------------------------------------------------------------------------
// API routes (server) — single source of truth for backend paths
// ---------------------------------------------------------------------------

export const API_ROUTES = {
  auth: {
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  users: {
    profile: '/users/profile',
    avatar: '/users/avatar',
    account: '/users/account',
    family: '/users/family',
  },
  students: {
    profile: '/students/profile',
    dashboard: (id: string) => `/students/${id}/dashboard`,
    studySessions: '/students/study-sessions',
    progress: (id: string) => `/students/${id}/progress`,
    streaks: (id: string) => `/students/${id}/streaks`,
    examHistory: (id: string) => `/students/${id}/exam-history`,
    weakAreas: (id: string) => `/students/${id}/weak-areas`,
  },
  parents: {
    profile: '/parents/profile',
    children: (id: string) => `/parents/${id}/children`,
    dashboard: (id: string) => `/parents/${id}/dashboard`,
    childSummary: (studentId: string) => `/parents/child/${studentId}/summary`,
  },
  exams: {
    base: '/exams',
    byId: (id: string) => `/exams/${id}`,
    aiGenerate: '/exams/ai-generate',
    attempt: (id: string) => `/exams/${id}/attempt`,
    submitAnswer: (attemptId: string) => `/exams/attempts/${attemptId}`,
    complete: (attemptId: string) => `/exams/attempts/${attemptId}/complete`,
    results: (attemptId: string) => `/exams/attempts/${attemptId}/results`,
    challenge: (id: string) => `/exams/${id}/challenge`,
    challenges: '/exams/challenges',
  },
  health: {
    foodLog: '/health/food-log',
    foodPhoto: '/health/food-log/photo',
    activity: '/health/activity',
    sleep: '/health/sleep',
    mood: '/health/mood',
    moodTrend: '/health/mood/trend',
    stressRelief: '/health/stress-relief',
    summary: (studentId: string) => `/health/summary/${studentId}`,
    nutritionScore: (studentId: string) => `/health/nutrition-score/${studentId}`,
    parentMood: '/health/parent/mood',
    parentJournal: '/health/parent/journal',
  },
  finance: {
    expenses: '/finance/expenses',
    summary: '/finance/summary',
    budget: '/finance/budget',
    budgetAlerts: '/finance/budget/alerts',
    pocketMoney: '/finance/pocket-money',
    junkFoodReport: '/finance/junk-food-report',
    tuitionFees: '/finance/tuition-fees',
    annualReport: '/finance/annual-report',
  },
  ai: {
    tutorAsk: '/ai/tutor/ask',
    studyPlan: '/ai/tutor/study-plan',
    conversations: '/ai/tutor/conversations',
    examGenerate: '/ai/exam/generate',
    examEvaluate: '/ai/exam/evaluate',
    analyzeFoodPhoto: '/ai/health/analyze-food-photo',
    healthInsights: (studentId: string) => `/ai/health/insights/${studentId}`,
    weeklyDigest: (familyId: string) => `/ai/parent/weekly-digest/${familyId}`,
    tips: (studentId: string) => `/ai/parent/tips/${studentId}`,
    suggestVacation: '/ai/family/suggest-vacation',
    suggestOuting: '/ai/family/suggest-outing',
    suggestDinner: '/ai/family/suggest-dinner',
    usage: '/ai/usage',
  },
  notifications: {
    base: '/notifications',
    preferences: '/notifications/preferences',
  },
} as const;

// ---------------------------------------------------------------------------
// App routes (frontend)
// ---------------------------------------------------------------------------

export const APP_ROUTES = {
  login: '/login',
  register: '/register',
  verifyOtp: '/verify-otp',
  dashboard: '/dashboard',
  children: '/children',
  child: (id: string) => `/children/${id}`,
  finance: '/finance',
  expenses: '/finance/expenses',
  budget: '/finance/budget',
  family: '/family',
  calendar: '/family/calendar',
  vacations: '/family/vacations',
  outings: '/family/outings',
  dinners: '/family/dinners',
  photos: '/family/photos',
  wellness: '/wellness',
  notifications: '/notifications',
  settings: '/settings',
} as const;
