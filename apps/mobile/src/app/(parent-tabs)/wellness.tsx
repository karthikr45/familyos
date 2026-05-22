import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Screen, Card, Heading, Muted, Button } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';
import { MOOD_TYPES } from '@familyos/shared';
import type { MoodLevel } from '@familyos/shared';

const MOODS = Object.entries(MOOD_TYPES) as [MoodLevel, (typeof MOOD_TYPES)[MoodLevel]][];

export default function ParentWellness() {
  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [journal, setJournal] = useState('');

  const logMood = useMutation({
    mutationFn: () => unwrap(api.post('/health/parent/mood', { mood: selected })),
  });
  const saveJournal = useMutation({
    mutationFn: () => unwrap(api.post('/health/parent/journal', { content: journal })),
    onSuccess: () => setJournal(''),
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Heading>Your wellness</Heading>
        <Muted>A private space, just for you.</Muted>

        <Card>
          <Text className="font-semibold text-gray-900">How are you today?</Text>
          <View className="mt-3 flex-row justify-between">
            {MOODS.map(([key, mood]) => (
              <Pressable
                key={key}
                onPress={() => {
                  setSelected(key);
                  logMood.mutate();
                }}
                className={`items-center rounded-2xl p-2 ${selected === key ? 'bg-indigo-100' : ''}`}
              >
                <Text className="text-3xl">{mood.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text className="font-semibold text-gray-900">Private journal 🔒</Text>
          <Muted>Only you can see this.</Muted>
          <TextInput
            className="mt-3 h-28 rounded-xl border border-gray-300 bg-white p-3"
            placeholder="Write your thoughts…"
            multiline
            value={journal}
            onChangeText={setJournal}
          />
          <View className="mt-3">
            <Button
              title="Save entry"
              loading={saveJournal.isPending}
              disabled={!journal}
              onPress={() => saveJournal.mutate()}
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
