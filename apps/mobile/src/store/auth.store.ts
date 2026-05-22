import { create } from 'zustand';
import type { UserRole } from '@familyos/shared';
import { tokenStore } from '../lib/api';

interface AuthState {
  initialized: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  userId: string | null;
  bootstrap: () => Promise<void>;
  signIn: (accessToken: string, refreshToken: string) => Promise<void>;
  setIdentity: (userId: string, role: UserRole) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  isAuthenticated: false,
  role: null,
  userId: null,
  bootstrap: async () => {
    const token = await tokenStore.getAccess();
    set({ isAuthenticated: !!token, initialized: true });
  },
  signIn: async (accessToken, refreshToken) => {
    await tokenStore.set(accessToken, refreshToken);
    set({ isAuthenticated: true });
  },
  setIdentity: (userId, role) => set({ userId, role }),
  signOut: async () => {
    await tokenStore.clear();
    set({ isAuthenticated: false, role: null, userId: null });
  },
}));
