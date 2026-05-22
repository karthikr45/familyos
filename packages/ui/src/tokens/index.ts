/** Shared design tokens for FamilyOS web and mobile. */

export const colors = {
  primary: '#4f46e5', // indigo
  primaryForeground: '#ffffff',
  accent: '#22c55e', // green
  accentForeground: '#ffffff',
  danger: '#dc2626',
  warning: '#f59e0b',
  muted: '#6b7280',
  background: '#ffffff',
  foreground: '#0f172a',
  card: '#ffffff',
  border: '#e2e8f0',
} as const;

export const moodColors: Record<string, string> = {
  VERY_SAD: '#dc2626',
  SAD: '#f59e0b',
  NEUTRAL: '#a3a3a3',
  HAPPY: '#22c55e',
  VERY_HAPPY: '#16a34a',
};

export const eventColors: Record<string, string> = {
  EXAM: '#dc2626',
  VACATION: '#22c55e',
  OUTING: '#3b82f6',
  DINNER: '#8b5cf6',
  ACTIVITY: '#f59e0b',
  OTHER: '#6b7280',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;
