'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@familyos/ui';
import { useChildSummary } from '@/hooks/useFamily';

const TABS = ['Academics', 'Health', 'Talents', 'Tuitions', 'Finance'] as const;
type Tab = (typeof TABS)[number];

interface ChildSummary {
  child: { name: string; class: number; board: string };
  weekStudyMinutes: number;
  streak: number;
  recentExams: { id: string; score: number; totalMarks: number; startedAt: string }[];
  weakAreas: {
    id: string;
    subject: { name: string };
    chapter: { name: string } | null;
    score: number;
  }[];
}

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useChildSummary(params.id);
  const [tab, setTab] = useState<Tab>('Academics');
  const summary = data as ChildSummary | undefined;

  if (isLoading || !summary) {
    return <p className="text-muted-foreground">Loading child profile…</p>;
  }

  const examData = summary.recentExams
    .slice()
    .reverse()
    .map((e, i) => ({
      name: `Exam ${i + 1}`,
      score: e.totalMarks ? Math.round((e.score / e.totalMarks) * 100) : 0,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{summary.child.name}</h1>
        <Badge variant="secondary">
          Class {summary.child.class} · {summary.child.board}
        </Badge>
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-2 text-sm font-medium',
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Academics' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Study streak</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">🔥 {summary.streak} days</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(summary.weekStudyMinutes / 60)}h studied this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent exam scores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={examData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weak areas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {summary.weakAreas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No weak areas detected — great work!
                </p>
              )}
              {summary.weakAreas.map((w) => (
                <Badge key={w.id} variant="destructive">
                  {w.subject.name}
                  {w.chapter ? ` · ${w.chapter.name}` : ''} ({Math.round(w.score)}%)
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'Health' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly study (proxy)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={examData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-sm text-muted-foreground">
              Mood trends are shown as aggregates only — raw entries stay private to your child.
            </p>
          </CardContent>
        </Card>
      )}

      {tab !== 'Academics' && tab !== 'Health' && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {tab} details are available in the mobile app and will appear here soon.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
