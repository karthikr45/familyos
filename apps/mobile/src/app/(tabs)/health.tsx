import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Heading, Muted } from '../../components/shared/ui';

const LOGS = [
  { label: 'Food', emoji: '🍱', href: '/health/food-log' as const },
  { label: 'Activity', emoji: '🏃', href: '/health/activity-log' as const },
  { label: 'Mood', emoji: '😊', href: '/health/mood-check' as const },
  { label: 'Stress Relief', emoji: '🧘', href: '/health/stress-relief' as const },
];

export default function Health() {
  const router = useRouter();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View>
          <Heading>Health</Heading>
          <Muted>Track how you eat, move, sleep, and feel</Muted>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {LOGS.map((l) => (
            <Pressable
              key={l.label}
              onPress={() => router.push(l.href)}
              className="w-[47%] rounded-2xl bg-white p-5 shadow-sm active:opacity-80"
            >
              <Text className="text-4xl">{l.emoji}</Text>
              <Text className="mt-2 font-semibold text-gray-900">{l.label}</Text>
            </Pressable>
          ))}
        </View>
        <Card>
          <Text className="font-semibold text-gray-900">Your week</Text>
          <Muted>Keep logging to see your weekly health score build up here.</Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
