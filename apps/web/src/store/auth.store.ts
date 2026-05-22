import { create } from 'zustand';
import type { UserDto } from '@familyos/shared';
import { tokenStore } from '@/lib/api';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  setUser: (user: UserDto | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: typeof window !== 'undefined' && !!tokenStore.access,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (accessToken, refreshToken) => {
    tokenStore.set(accessToken, refreshToken);
    set({ isAuthenticated: true });
  },
  logout: () => {
    tokenStore.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
