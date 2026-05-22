import { Text } from 'react-native';
import { Tabs } from 'expo-router';

function icon(emoji: string) {
  return ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: icon('💬') }} />
      <Tabs.Screen name="exams" options={{ title: 'Exams', tabBarIcon: icon('📝') }} />
      <Tabs.Screen name="health" options={{ title: 'Health', tabBarIcon: icon('🍎') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
