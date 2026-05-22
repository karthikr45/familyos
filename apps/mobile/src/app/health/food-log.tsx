import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Screen, Heading, Muted, Button } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';
import { useStudentProfile } from '../../hooks/useStudent';
import { MEAL_TYPES } from '@familyos/shared';
import type { MealType } from '@familyos/shared';

const MEALS = Object.keys(MEAL_TYPES) as MealType[];

export default function FoodLog() {
  const router = useRouter();
  const { data: profile } = useStudentProfile();
  const [meal, setMeal] = useState<MealType>('BREAKFAST');
  const [items, setItems] = useState('');

  const log = useMutation({
    mutationFn: () =>
      unwrap(
        api.post('/health/food-log', {
          studentId: profile?.id,
          mealType: meal,
          items: items
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((name) => ({ name })),
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
        <Heading>Log a meal</Heading>
        <Muted>Snap a photo or list what you ate</Muted>

        <View className="mt-6 flex-row flex-wrap gap-2">
          {MEALS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMeal(m)}
              className={`rounded-full px-4 py-2 ${meal === m ? 'bg-primary' : 'bg-white'}`}
            >
              <Text className={meal === m ? 'text-white' : 'text-gray-700'}>
                {MEAL_TYPES[m].label}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          className="mt-6 h-24 rounded-xl border border-gray-300 bg-white p-4"
          placeholder="e.g. Idli, sambar, coconut chutney"
          multiline
          value={items}
          onChangeText={setItems}
        />

        <View className="mt-auto">
          <Button
            title="Save meal"
            loading={log.isPending}
            disabled={!items}
            onPress={() => log.mutate()}
          />
        </View>
      </View>
    </Screen>
  );
}
