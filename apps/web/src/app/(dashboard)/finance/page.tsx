'use client';

import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBudgets, useCreateExpense, useExpenses, useFinanceSummary } from '@/hooks/useFinance';
import { useActiveFamilyId } from '@/hooks/useFamily';
import { EXPENSE_CATEGORIES, formatCurrency, JUNK_FOOD_SPEND_THRESHOLD } from '@familyos/shared';

const COLORS = EXPENSE_CATEGORIES.map((c) => c.color);

export default function FinancePage() {
  const familyId = useActiveFamilyId();
  const summary = useFinanceSummary(familyId);
  const budgets = useBudgets(familyId);
  const expenses = useExpenses(familyId);
  const createExpense = useCreateExpense(familyId);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const pieData = (summary.data?.byCategory ?? []).map((c) => ({
    name: c.categoryName,
    value: c.total,
  }));

  const junkSpend = summary.data?.junkFoodSpend ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Family Finance</h1>
        <Button onClick={() => setShowForm((v) => !v)}>Add expense</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <Input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="max-w-[160px]"
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="max-w-[260px]"
            />
            <Button
              disabled={!amount || createExpense.isPending}
              onClick={() =>
                createExpense.mutate(
                  {
                    amount: Number(amount),
                    description,
                    categoryId: EXPENSE_CATEGORIES[0]?.key ?? 'OTHER',
                  },
                  {
                    onSuccess: () => {
                      setAmount('');
                      setDescription('');
                      setShowForm(false);
                    },
                  },
                )
              }
            >
              Save
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend by category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Total: {formatCurrency(summary.data?.totalSpent ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budgets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(budgets.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No budgets set.</p>
            )}
            {(budgets.data ?? []).map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.monthlyLimit) * 100));
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm">
                    <span>{b.categoryName}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(b.spent)} / {formatCurrency(b.monthlyLimit)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-secondary">
                    <div
                      className={`h-2 rounded-full ${pct >= 100 ? 'bg-destructive' : 'bg-accent'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {junkSpend > JUNK_FOOD_SPEND_THRESHOLD && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                Junk food spend is {formatCurrency(junkSpend)} this month — above the healthy limit.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {(expenses.data ?? []).slice(0, 12).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span>{e.description || e.category?.name || 'Expense'}</span>
              <span className={e.isJunkFood ? 'font-medium text-destructive' : 'font-medium'}>
                {formatCurrency(e.amount)}
              </span>
            </div>
          ))}
          {(expenses.data ?? []).length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">No transactions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
