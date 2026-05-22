'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCalendar, useCreateEvent, useActiveFamilyId } from '@/hooks/useFamily';
import { eventColors } from '@familyos/ui';
import { formatDate } from '@familyos/shared';

const EVENT_TYPES = ['EXAM', 'VACATION', 'OUTING', 'DINNER', 'ACTIVITY', 'OTHER'] as const;

export default function CalendarPage() {
  const familyId = useActiveFamilyId();
  const { data: events } = useCalendar(familyId);
  const createEvent = useCreateEvent(familyId);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]>('OTHER');
  const [date, setDate] = useState('');
  const [conflict, setConflict] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Family Calendar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add an event</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-[220px]"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as (typeof EVENT_TYPES)[number])}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="max-w-[180px]"
          />
          <Button
            disabled={!title || !date || createEvent.isPending}
            onClick={() =>
              createEvent.mutate(
                { title, type, startDate: new Date(date).toISOString(), allDay: true },
                {
                  onSuccess: (res) => {
                    const r = res as { examConflict?: unknown };
                    setConflict(
                      r?.examConflict ? 'Heads up: this overlaps an exam on the calendar.' : null,
                    );
                    setTitle('');
                    setDate('');
                  },
                },
              )
            }
          >
            Add
          </Button>
          {conflict && <p className="w-full text-sm text-destructive">{conflict}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(events ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          )}
          {(events ?? []).map((event) => (
            <div key={event.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: eventColors[event.type] ?? eventColors.OTHER }}
              />
              <span className="flex-1 font-medium">{event.title}</span>
              <span className="text-muted-foreground">{formatDate(event.startDate)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
