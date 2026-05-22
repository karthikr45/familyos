import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function Index() {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;
    router.replace(isAuthenticated ? '/(tabs)/home' : '/(auth)/welcome');
  }, [initialized, isAuthenticated, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}
