import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { AuthTokens, UserDto } from '@familyos/shared';
import { api, unwrap } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export function useCurrentUser() {
  const setIdentity = useAuthStore((s) => s.setIdentity);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await unwrap<UserDto>(api.get('/auth/me'));
      setIdentity(user.id, user.role);
      return user;
    },
    enabled: isAuthenticated,
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => unwrap(api.post('/auth/send-otp', { phone })),
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: (input: { phone: string; otp: string }) =>
      unwrap<AuthTokens>(api.post('/auth/verify-otp', input)),
    onSuccess: async (tokens) => {
      await signIn(tokens.accessToken, tokens.refreshToken);
      router.replace('/(tabs)/home');
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      unwrap<AuthTokens>(api.post('/auth/login', input)),
    onSuccess: async (tokens) => {
      await signIn(tokens.accessToken, tokens.refreshToken);
      router.replace('/(tabs)/home');
    },
  });
}
