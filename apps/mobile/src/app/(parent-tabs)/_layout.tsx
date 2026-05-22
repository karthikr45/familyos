import { Text } from 'react-native';
import { Tabs } from 'expo-router';

function icon(emoji: string) {
  return ({ color }: { color: string }) => <Text style={{ color, fontSize: 20 }}>{emoji}</Text>;
}

export default function ParentTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="children" options={{ title: 'Children', tabBarIcon: icon('🧒') }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance', tabBarIcon: icon('💰') }} />
      <Tabs.Screen name="family" options={{ title: 'Family', tabBarIcon: icon('📅') }} />
      <Tabs.Screen name="wellness" options={{ title: 'Wellness', tabBarIcon: icon('🧘') }} />
    </Tabs>
  );
}
