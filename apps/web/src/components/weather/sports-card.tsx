'use client';

import type { SportsDto, SportsEventDto } from '@familyos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@familyos/shared';

const SECTIONS: { key: keyof SportsDto; label: string; emoji: string }[] = [
  { key: 'cricket', label: 'Cricket', emoji: '🏏' },
  { key: 'football', label: 'Football', emoji: '⚽' },
  { key: 'golf', label: 'Golf', emoji: '⛳' },
];

export function SportsCard({ sports }: { sports: SportsDto }) {
  const total = sports.cricket.length + sports.football.length + sports.golf.length;
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Upcoming matches nearby</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {SECTIONS.map(({ key, label, emoji }) => {
          const events = sports[key].slice(0, 4);
          if (events.length === 0) return null;
          return (
            <div key={key}>
              <p className="mb-1 text-sm font-semibold">
                {emoji} {label}
              </p>
              <div className="space-y-1">
                {events.map((e: SportsEventDto, i) => (
                  <div
                    key={`${e.match}-${i}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{e.match}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.tournament} · {e.stadium}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(e.start, 'datetime')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
