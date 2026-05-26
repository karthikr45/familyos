'use client';

import { Droplets } from 'lucide-react';
import type { HourlyWeatherDto } from '@familyos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hourLabel, icon } from '@/lib/weather';

export function HourlyStrip({ hours }: { hours: HourlyWeatherDto[] }) {
  // Show from the current hour onward (next 24).
  const now = Date.now();
  const upcoming = hours.filter(
    (h) => new Date(h.time.replace(' ', 'T')).getTime() >= now - 3600_000,
  );
  const list = (upcoming.length ? upcoming : hours).slice(0, 24);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Hourly</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {list.map((h) => (
            <div
              key={h.time}
              className="flex min-w-[64px] flex-col items-center rounded-xl bg-secondary/60 px-2 py-3"
            >
              <span className="text-xs text-muted-foreground">{hourLabel(h.time)}</span>
              {h.condition.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon(h.condition.icon)} alt={h.condition.text} width={36} height={36} />
              )}
              <span className="text-sm font-semibold">{Math.round(h.tempC)}°</span>
              <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                <Droplets className="h-3 w-3" />
                {h.chanceOfRain}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
