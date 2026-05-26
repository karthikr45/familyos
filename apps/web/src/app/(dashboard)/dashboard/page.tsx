'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarDays, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WeatherCard } from '@/components/dashboard/weather-card';
import { useParentDashboard, useActiveFamilyId } from '@/hooks/useFamily';
import { useCurrentUser } from '@/hooks/useAuth';
import { formatCurrency, formatDate, MOOD_TYPES } from '@familyos/shared';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const { data, isLoading } = useParentDashboard(user?.id);
  useActiveFamilyId();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading your dashboard…</div>;
  }

  const children = data?.children ?? [];
  const alerts = data?.alerts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good to see you 👋</h1>
        <p className="text-muted-foreground">{formatDate(new Date(), 'weekday')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <Link href={`/children/${child.id}`} className="hover:underline">
                  {child.name}
                </Link>
                <Badge variant="secondary">
                  Class {child.class} · {child.board}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Study this week</span>
                <span className="font-medium">{Math.round(child.weekStudyMinutes / 60)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last exam</span>
                <span className="font-medium">
                  {child.lastExamScore !== null ? `${child.lastExamScore}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mood</span>
                <span>
                  {child.latestMood
                    ? MOOD_TYPES[child.latestMood as keyof typeof MOOD_TYPES]?.emoji
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {children.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No children added yet. Add a child to start tracking.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> AI Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 && <p className="text-sm text-muted-foreground">All clear 🎉</p>}
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-md border border-l-4 border-l-warning p-3">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-accent" /> This month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(data?.monthSpend ?? 0)}</p>
            <p className="text-sm text-muted-foreground">spent so far</p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/finance">View finances</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WeatherCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" /> Upcoming events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.upcomingEvents ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
          )}
          {(data?.upcomingEvents ?? []).map((event) => (
            <div key={event.id} className="flex items-center justify-between text-sm">
              <span>{event.title}</span>
              <span className="text-muted-foreground">{formatDate(event.startDate)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/finance/expenses">Log expense</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/family">
            <TrendingUp className="h-4 w-4" /> Plan an outing
          </Link>
        </Button>
      </div>
    </div>
  );
}
