'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, tokenStore, unwrap } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { AuthTokens, UserDto } from '@familyos/shared';

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await unwrap<UserDto>(api.get('/auth/me'));
      setUser(user);
      return user;
    },
    enabled: typeof window !== 'undefined' && !!tokenStore.access,
  });
}

export function useLogin() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      unwrap<AuthTokens>(api.post('/auth/login', input)),
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (input: { email: string; password: string; name: string }) =>
      unwrap<AuthTokens>(api.post('/auth/register', input)),
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => unwrap(api.post('/auth/send-otp', { phone })),
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (input: { phone: string; otp: string }) =>
      unwrap<AuthTokens>(api.post('/auth/verify-otp', input)),
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  return () => {
    const refresh = tokenStore.refresh;
    if (refresh) void api.post('/auth/logout', { refreshToken: refresh }).catch(() => undefined);
    logout();
    queryClient.clear();
    router.push('/login');
  };
}
