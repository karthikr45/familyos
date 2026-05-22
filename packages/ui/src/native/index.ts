import { clsx, type ClassValue } from 'clsx';

/** Class name merge for NativeWind (no DOM-specific Tailwind merge needed). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export * from '../tokens';
