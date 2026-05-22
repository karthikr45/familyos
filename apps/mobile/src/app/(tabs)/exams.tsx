import { ScrollView, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Card, Heading, Muted } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';

interface ExamRow {
  id: string;
  title: string;
  totalMarks: number;
  isAiGenerated: boolean;
  subject?: { name: string };
  _count?: { questions: number };
}

export default function Exams() {
  const { data } = useQuery({
    queryKey: ['exams'],
    queryFn: () => unwrap<ExamRow[]>(api.get('/exams')),
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Heading>Mock Exams</Heading>
        <Muted>Practice exams and challenge your friends</Muted>

        {(data ?? []).map((exam) => (
          <Card key={exam.id}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{exam.title}</Text>
                <Muted>
                  {exam.subject?.name ?? 'Subject'} · {exam._count?.questions ?? exam.totalMarks}{' '}
                  questions
                </Muted>
              </View>
              {exam.isAiGenerated && (
                <View className="rounded-full bg-indigo-50 px-2 py-1">
                  <Text className="text-xs text-primary">AI</Text>
                </View>
              )}
            </View>
          </Card>
        ))}
        {(data ?? []).length === 0 && (
          <Text className="mt-10 text-center text-gray-400">
            No exams yet. Generate one from the web app or ask your AI tutor.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
