import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, resolving conflicts (web). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export * from './tokens';
