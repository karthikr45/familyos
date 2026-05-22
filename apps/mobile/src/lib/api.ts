import axios, { type AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const ACCESS_KEY = 'familyos_access';
const REFRESH_KEY = 'familyos_refresh';

export const tokenStore = {
  getAccess: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_KEY),
  async set(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as { _retry?: boolean; headers?: Record<string, string> };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refresh = await tokenStore.getRefresh();
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken: refresh,
          });
          const tokens = data.data ?? data;
          await tokenStore.set(tokens.accessToken, tokens.refreshToken);
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(original);
        } catch {
          await tokenStore.clear();
        }
      }
    }
    return Promise.reject(error);
  },
);

export async function unwrap<T>(promise: Promise<{ data: { data?: T } | T }>): Promise<T> {
  const res = await promise;
  const body = res.data as { data?: T };
  return (body.data ?? body) as T;
}
