'use client';

import { Droplets, Wind } from 'lucide-react';
import type { ForecastDayDto } from '@familyos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { icon, outdoorScore, shortDay } from '@/lib/weather';

export function ForecastCards({ days }: { days: ForecastDayDto[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{days.length}-day forecast</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day, i) => {
          const { score, verdict } = outdoorScore(day);
          const scoreTone =
            score >= 75
              ? 'bg-emerald-100 text-emerald-700'
              : score >= 50
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700';
          return (
            <div key={day.date} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{i === 0 ? 'Today' : shortDay(day.date)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreTone}`}>
                  {score}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {day.condition.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={icon(day.condition.icon)}
                    alt={day.condition.text}
                    width={48}
                    height={48}
                  />
                )}
                <div>
                  <p className="text-lg font-bold">
                    {Math.round(day.maxTempC)}°{' '}
                    <span className="text-muted-foreground">/ {Math.round(day.minTempC)}°</span>
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">{day.condition.text}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-blue-500">
                  <Droplets className="h-3 w-3" /> {day.chanceOfRain}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="h-3 w-3" /> {Math.round(day.maxWindKph)} kph
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-foreground/70">{verdict}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
