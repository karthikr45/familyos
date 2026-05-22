import { ScrollView, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Card, Heading, Muted } from '../../components/shared/ui';
import { api, unwrap } from '../../lib/api';
import { useFamilies } from '../../hooks/useParent';
import { formatCurrency } from '@familyos/shared';
import type { FinanceSummaryDto } from '@familyos/shared';

export default function ParentFinance() {
  const { data: families } = useFamilies();
  const familyId = families?.[0]?.id;

  const { data: summary } = useQuery({
    queryKey: ['finance-summary', familyId],
    queryFn: () => unwrap<FinanceSummaryDto>(api.get('/finance/summary', { params: { familyId } })),
    enabled: !!familyId,
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Heading>Finance</Heading>
        <Card>
          <Muted>Spent this month</Muted>
          <Text className="text-3xl font-bold text-primary">
            {formatCurrency(summary?.totalSpent ?? 0)}
          </Text>
          {(summary?.junkFoodSpend ?? 0) > 0 && (
            <Text className="mt-1 text-sm text-red-600">
              Junk food: {formatCurrency(summary?.junkFoodSpend ?? 0)}
            </Text>
          )}
        </Card>
        <Card>
          <Text className="font-semibold text-gray-900">By category</Text>
          {(summary?.byCategory ?? []).map((c) => (
            <View key={c.categoryId} className="mt-2 flex-row justify-between">
              <Muted>{c.categoryName}</Muted>
              <Text className="text-gray-900">{formatCurrency(c.total)}</Text>
            </View>
          ))}
          {(summary?.byCategory ?? []).length === 0 && <Muted>No expenses this month.</Muted>}
        </Card>
      </ScrollView>
    </Screen>
  );
}
