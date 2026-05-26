import { ScrollView, View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Screen, Card, Heading, Muted } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';
import { useFamilies } from '../../hooks/useParent';
import { formatDate } from '@familyos/shared';

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startDate: string;
}

export default function ParentFamily() {
  const router = useRouter();
  const { data: families } = useFamilies();
  const familyId = families?.[0]?.id;

  const { data: events } = useQuery({
    queryKey: ['calendar', familyId],
    queryFn: () => unwrap<CalendarEvent[]>(api.get(`/family/${familyId}/calendar`)),
    enabled: !!familyId,
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Heading>Family</Heading>

        <Pressable onPress={() => router.push('/weather')}>
          <Card className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">⛅ Weather &amp; planning</Text>
              <Muted>Forecast and the best days for outings</Muted>
            </View>
            <Text className="text-primary">›</Text>
          </Card>
        </Pressable>

        <Card>
          <Text className="font-semibold text-gray-900">Upcoming events</Text>
          {(events ?? []).map((e) => (
            <View key={e.id} className="mt-2 flex-row justify-between">
              <Muted>{e.title}</Muted>
              <Muted>{formatDate(e.startDate)}</Muted>
            </View>
          ))}
          {(events ?? []).length === 0 && <Muted>Nothing scheduled.</Muted>}
        </Card>
      </ScrollView>
    </Screen>
  );
}
