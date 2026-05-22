import type { UserRole } from '@familyos/shared';

/** Shape of the JWT payload and the `request.user` object after auth. */
export interface AuthUser {
  userId: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  studentProfileId?: string | null;
  familyIds?: string[];
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
