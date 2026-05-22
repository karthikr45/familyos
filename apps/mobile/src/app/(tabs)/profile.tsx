import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Heading, Muted, Button } from '../../components/shared/ui';
import { useCurrentUser } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';

export default function Profile() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <Screen>
      <View className="flex-1 p-5">
        <Heading>Profile</Heading>
        <Card className="mt-4">
          <Text className="text-lg font-semibold text-gray-900">
            {user?.name ?? user?.phone ?? 'You'}
          </Text>
          <Muted>{user?.email ?? user?.phone ?? ''}</Muted>
          <Text className="mt-2 text-sm capitalize text-gray-500">{user?.role?.toLowerCase()}</Text>
        </Card>
        <View className="mt-auto">
          <Button
            title="Sign out"
            variant="outline"
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/welcome');
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
