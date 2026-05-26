'use client';

import { Waves } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarine } from '@/hooks/useWeather';
import { shortDay } from '@/lib/weather';

/** Marine forecast — only renders when the provider returns tide/swell data. */
export function MarineCard({ location }: { location: string }) {
  const { data, isError } = useMarine(location, true);

  if (isError || !data) return null;
  const days = data.days.filter(
    (d) => d.tides.length > 0 || d.hours.some((h) => h.swellHeightMt > 0),
  );
  if (days.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Waves className="h-4 w-4 text-cyan-600" /> Marine &amp; tides
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {days.slice(0, 3).map((day) => {
          const maxSwell = Math.max(0, ...day.hours.map((h) => h.swellHeightMt));
          const waterTemp = day.hours.find((h) => h.waterTempC > 0)?.waterTempC;
          return (
            <div key={day.date} className="rounded-xl bg-secondary/60 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{shortDay(day.date)}</span>
                <span className="text-muted-foreground">
                  Swell {maxSwell.toFixed(1)} m
                  {waterTemp ? ` · Water ${Math.round(waterTemp)}°C` : ''}
                </span>
              </div>
              {day.tides.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {day.tides.slice(0, 4).map((t, i) => (
                    <span key={i} className="rounded-full bg-cyan-100 px-2 py-0.5 text-cyan-800">
                      {t.type} {t.heightMt.toFixed(1)}m ·{' '}
                      {new Date(t.time.replace(' ', 'T')).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
