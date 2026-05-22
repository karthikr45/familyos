import { ScrollView, View, Text } from 'react-native';
import { Screen, Card, Heading, Muted } from '../../components/shared/ui';
import { useParentDashboard } from '../../hooks/useParent';
import { formatCurrency, MOOD_TYPES } from '@familyos/shared';

export default function ParentDashboard() {
  const { data } = useParentDashboard();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Heading>Family overview</Heading>

        {(data?.children ?? []).map((child) => (
          <Card key={child.id}>
            <Text className="font-semibold text-gray-900">{child.name}</Text>
            <View className="mt-2 flex-row justify-between">
              <Muted>Study: {Math.round(child.weekStudyMinutes / 60)}h</Muted>
              <Muted>
                Mood:{' '}
                {child.latestMood
                  ? MOOD_TYPES[child.latestMood as keyof typeof MOOD_TYPES]?.emoji
                  : '—'}
              </Muted>
              <Muted>
                Last exam: {child.lastExamScore !== null ? `${child.lastExamScore}%` : '—'}
              </Muted>
            </View>
          </Card>
        ))}

        <Card>
          <Text className="font-semibold text-gray-900">AI Alerts</Text>
          {(data?.alerts ?? []).length === 0 && <Muted>All clear 🎉</Muted>}
          {(data?.alerts ?? []).map((a) => (
            <View key={a.id} className="mt-2 border-l-4 border-amber-400 pl-3">
              <Text className="font-medium text-gray-900">{a.title}</Text>
              <Muted>{a.body}</Muted>
            </View>
          ))}
        </Card>

        <Card>
          <Muted>This month</Muted>
          <Text className="text-3xl font-bold text-primary">
            {formatCurrency(data?.monthSpend ?? 0)}
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
