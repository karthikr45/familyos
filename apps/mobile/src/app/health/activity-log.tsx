import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Screen, Heading, Muted, Button } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';
import { useStudentProfile } from '../../hooks/useStudent';
import { ACTIVITY_TYPES } from '@familyos/shared';

export default function ActivityLog() {
  const router = useRouter();
  const { data: profile } = useStudentProfile();
  const [type, setType] = useState(ACTIVITY_TYPES[0]?.value ?? 'WALKING');
  const [duration, setDuration] = useState('30');

  const log = useMutation({
    mutationFn: () =>
      unwrap(
        api.post('/health/activity', {
          studentId: profile?.id,
          activityType: type,
          durationMinutes: Number(duration) || 1,
        }),
      ),
    onSuccess: () => router.back(),
  });

  return (
    <Screen>
      <View className="flex-1 p-5">
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-primary">← Back</Text>
        </Pressable>
        <Heading>Log activity</Heading>
        <Muted>Every bit of movement counts</Muted>

        <View className="mt-6 flex-row flex-wrap gap-2">
          {ACTIVITY_TYPES.map((a) => (
            <Pressable
              key={a.value}
              onPress={() => setType(a.value)}
              className={`rounded-full px-4 py-2 ${type === a.value ? 'bg-accent' : 'bg-white'}`}
            >
              <Text className={type === a.value ? 'text-white' : 'text-gray-700'}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="mt-6 text-gray-700">Duration (minutes)</Text>
        <TextInput
          className="mt-2 h-12 rounded-xl border border-gray-300 bg-white px-4"
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
        />

        <View className="mt-auto">
          <Button title="Save activity" loading={log.isPending} onPress={() => log.mutate()} />
        </View>
      </View>
    </Screen>
  );
}
