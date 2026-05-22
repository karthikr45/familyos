import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Button } from '../../components/shared/ui';

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen>
      <View className="flex-1 justify-center px-8">
        <Text className="text-4xl font-bold text-primary">FamilyOS</Text>
        <Text className="mt-3 text-lg text-gray-600">
          Learn, grow, and stay healthy — together as a family.
        </Text>
        <View className="mt-10 gap-3">
          <Button title="Get started" onPress={() => router.push('/(auth)/login')} />
          <Button
            title="I have a code"
            variant="outline"
            onPress={() => router.push('/(auth)/verify-otp')}
          />
        </View>
      </View>
    </Screen>
  );
}
