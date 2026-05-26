'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, CloudSun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationSearch } from '@/components/weather/location-search';
import { useWeatherForecast } from '@/hooks/useWeather';
import { icon, outdoorScore, shortDay } from '@/lib/weather';

const STORAGE_KEY = 'familyos.weatherLocation';

/**
 * Compact planner widget: shows outdoor suitability for the next few days and
 * highlights the best day to schedule a family outing.
 */
export function PlannerWeather() {
  const [location, setLocation] = useState('Mumbai');
  const [label, setLabel] = useState('Mumbai');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { location: string; label: string };
        setLocation(parsed.location);
        setLabel(parsed.label);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const { data } = useWeatherForecast(location, 5);
  const days = (data?.forecast ?? []).map((d) => ({ day: d, ...outdoorScore(d) }));
  const best = days.reduce<(typeof days)[number] | null>(
    (acc, d) => (!acc || d.score > acc.score ? d : acc),
    null,
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudSun className="h-4 w-4 text-primary" /> Plan around the weather
        </CardTitle>
        <Link href="/weather" className="text-xs text-primary hover:underline">
          Full forecast
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocationSearch
          onSelect={(loc, lbl) => {
            setLocation(loc);
            setLabel(lbl);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ location: loc, label: lbl }));
          }}
        />

        {!data && (
          <p className="text-sm text-muted-foreground">Set a location to see the outlook.</p>
        )}

        {best && best.score >= 60 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <CalendarCheck className="h-4 w-4" />
            Best day for an outing in {label}:{' '}
            <span className="font-semibold">{shortDay(best.day.date)}</span> ({best.score}/100)
          </div>
        )}

        {days.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {days.map(({ day, score }) => {
              const tone =
                score >= 75
                  ? 'bg-emerald-100 text-emerald-700'
                  : score >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700';
              return (
                <div key={day.date} className="rounded-xl border p-2 text-center">
                  <p className="text-xs font-medium">{shortDay(day.date)}</p>
                  {day.condition.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon(day.condition.icon)}
                      alt={day.condition.text}
                      width={36}
                      height={36}
                      className="mx-auto"
                    />
                  )}
                  <p className="text-xs">
                    {Math.round(day.maxTempC)}°/{Math.round(day.minTempC)}°
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}
                  >
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
