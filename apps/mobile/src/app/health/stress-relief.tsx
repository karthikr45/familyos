import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Screen, Heading, Muted, Button } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';
import { useStudentProfile } from '../../hooks/useStudent';

export default function StressRelief() {
  const router = useRouter();
  const { data: profile } = useStudentProfile();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'Breathe in' | 'Hold' | 'Breathe out'>('Breathe in');
  const scale = useRef(new Animated.Value(0.6)).current;

  const log = useMutation({
    mutationFn: (minutes: number) =>
      unwrap(
        api.post('/health/stress-relief', {
          studentId: profile?.id,
          sessionType: 'BREATHING',
          durationMinutes: minutes,
        }),
      ),
  });

  useEffect(() => {
    if (!running) return;
    const animate = () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(scale, {
          toValue: 0.6,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (running) animate();
      });
    };
    animate();
    const phases: (typeof phase)[] = ['Breathe in', 'Hold', 'Breathe out'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % phases.length;
      setPhase(phases[i]!);
    }, 3300);
    return () => clearInterval(interval);
  }, [running, scale]);

  return (
    <Screen>
      <View className="flex-1 items-center p-5">
        <Pressable onPress={() => router.back()} className="mb-4 self-start">
          <Text className="text-primary">← Back</Text>
        </Pressable>
        <Heading>Breathe</Heading>
        <Muted>A minute of calm can reset your day</Muted>

        <View className="my-12 h-72 items-center justify-center">
          <Animated.View
            style={{ transform: [{ scale }] }}
            className="h-48 w-48 items-center justify-center rounded-full bg-indigo-200"
          >
            <Text className="text-lg font-semibold text-primary">{running ? phase : 'Ready'}</Text>
          </Animated.View>
        </View>

        <View className="mt-auto w-full gap-3">
          {!running ? (
            <Button title="Start breathing" onPress={() => setRunning(true)} />
          ) : (
            <Button
              title="Finish session"
              variant="outline"
              onPress={() => {
                setRunning(false);
                log.mutate(2);
                router.back();
              }}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}
