import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Heading, Muted } from '../../components/shared/ui';
import { useStudentProfile, useStudentDashboard } from '../../hooks/useStudent';

const QUICK_ACTIONS = [
  { label: 'Study Now', emoji: '📚', href: '/(tabs)/learn' as const },
  { label: 'Log Food', emoji: '🍱', href: '/health/food-log' as const },
  { label: 'Check Mood', emoji: '😊', href: '/health/mood-check' as const },
  { label: 'Stress Relief', emoji: '🧘', href: '/health/stress-relief' as const },
  { label: 'Weather', emoji: '⛅', href: '/weather' as const },
];

export default function Home() {
  const router = useRouter();
  const { data: profile } = useStudentProfile();
  const { data: dashboard } = useStudentDashboard(profile?.id);

  const goal = dashboard?.dailyGoal ?? 60;
  const done = dashboard?.weekStudyMinutes ?? 0;
  const pct = goal ? Math.min(100, Math.round(((done % goal) / goal) * 100)) : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View>
          <Muted>Good morning</Muted>
          <Heading>{profile?.name ?? 'Student'} 👋</Heading>
        </View>

        <Card className="flex-row items-center justify-between">
          <View>
            <Muted>Today&apos;s goal</Muted>
            <Text className="text-3xl font-bold text-primary">{pct}%</Text>
            <Muted>{goal} min target</Muted>
          </View>
          <View className="items-center">
            <Text className="text-4xl">🔥</Text>
            <Text className="font-bold text-gray-900">{dashboard?.streak ?? 0} day streak</Text>
          </View>
        </Card>

        <View className="flex-row flex-wrap gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => router.push(a.href)}
              className="w-[47%] rounded-2xl bg-white p-4 shadow-sm active:opacity-80"
            >
              <Text className="text-3xl">{a.emoji}</Text>
              <Text className="mt-2 font-semibold text-gray-900">{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <Card>
          <Text className="font-semibold text-gray-900">Recent exam scores</Text>
          <View className="mt-3 flex-row gap-2">
            {(dashboard?.recentExams ?? []).slice(0, 5).map((e) => (
              <View key={e.id} className="rounded-lg bg-indigo-50 px-3 py-2">
                <Text className="font-bold text-primary">
                  {e.totalMarks ? Math.round((e.score / e.totalMarks) * 100) : 0}%
                </Text>
              </View>
            ))}
            {(dashboard?.recentExams ?? []).length === 0 && <Muted>No exams yet — try one!</Muted>}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
