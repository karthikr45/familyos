import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView className="flex-1 bg-gray-50">{children}</SafeAreaView>;
}

export function Card({ children, className, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={`rounded-2xl bg-white p-4 shadow-sm ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold text-gray-900">{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-gray-500">{children}</Text>;
}

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export function Button({ title, loading, variant = 'primary', ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      className={`h-12 items-center justify-center rounded-xl ${
        isPrimary ? 'bg-primary' : 'border border-gray-300 bg-white'
      } active:opacity-80`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#4f46e5'} />
      ) : (
        <Text className={`font-semibold ${isPrimary ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
