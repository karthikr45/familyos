import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Screen, Heading, Muted, Button } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';
import { useStudentProfile } from '../../hooks/useStudent';
import { MOOD_TYPES } from '@familyos/shared';
import type { MoodLevel } from '@familyos/shared';

const MOODS = Object.entries(MOOD_TYPES) as [MoodLevel, (typeof MOOD_TYPES)[MoodLevel]][];

export default function MoodCheck() {
  const router = useRouter();
  const { data: profile } = useStudentProfile();
  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [notes, setNotes] = useState('');

  const logMood = useMutation({
    mutationFn: () =>
      unwrap(
        api.post('/health/mood', {
          studentId: profile?.id,
          mood: selected,
          notes,
          isPrivate: true,
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
        <Heading>How are you feeling?</Heading>
        <Muted>This stays private — only you can see it.</Muted>

        <View className="mt-8 flex-row justify-between">
          {MOODS.map(([key, mood]) => (
            <Pressable
              key={key}
              onPress={() => setSelected(key)}
              className={`items-center rounded-2xl p-3 ${selected === key ? 'bg-indigo-100' : ''}`}
            >
              <Text className="text-4xl">{mood.emoji}</Text>
              <Text className="mt-1 text-xs text-gray-500">{mood.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          className="mt-8 h-24 rounded-xl border border-gray-300 bg-white p-4"
          placeholder="Anything on your mind? (optional)"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <View className="mt-auto">
          <Button
            title="Save check-in"
            loading={logMood.isPending}
            disabled={!selected}
            onPress={() => logMood.mutate()}
          />
        </View>
      </View>
    </Screen>
  );
}
