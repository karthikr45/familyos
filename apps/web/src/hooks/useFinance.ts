'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { FinanceSummaryDto } from '@familyos/shared';

export function useFinanceSummary(familyId: string | null) {
  return useQuery({
    queryKey: ['finance-summary', familyId],
    queryFn: () => unwrap<FinanceSummaryDto>(api.get('/finance/summary', { params: { familyId } })),
    enabled: !!familyId,
  });
}

export function useExpenses(familyId: string | null) {
  return useQuery({
    queryKey: ['expenses', familyId],
    queryFn: () => unwrap<ExpenseRow[]>(api.get('/finance/expenses', { params: { familyId } })),
    enabled: !!familyId,
  });
}

export function useBudgets(familyId: string | null) {
  return useQuery({
    queryKey: ['budgets', familyId],
    queryFn: () => unwrap<BudgetRow[]>(api.get('/finance/budget', { params: { familyId } })),
    enabled: !!familyId,
  });
}

export function useCreateExpense(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      unwrap(api.post('/finance/expenses', { ...body, familyId })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', familyId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', familyId] });
    },
  });
}

export interface ExpenseRow {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  isJunkFood: boolean;
  category?: { name: string; icon: string | null };
}

export interface BudgetRow {
  id: string;
  categoryName: string;
  monthlyLimit: number;
  spent: number;
}
