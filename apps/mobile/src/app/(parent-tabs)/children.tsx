import { ScrollView, Text } from 'react-native';
import { Screen, Card, Heading, Muted } from '../../components/shared/ui';
import { useParentDashboard } from '../../hooks/useParent';

export default function ParentChildren() {
  const { data } = useParentDashboard();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Heading>Children</Heading>
        {(data?.children ?? []).map((child) => (
          <Card key={child.id}>
            <Text className="font-semibold text-gray-900">{child.name}</Text>
            <Muted>
              Class {child.class} · {child.board}
            </Muted>
          </Card>
        ))}
        {(data?.children ?? []).length === 0 && <Muted>No children added yet.</Muted>}
      </ScrollView>
    </Screen>
  );
}
