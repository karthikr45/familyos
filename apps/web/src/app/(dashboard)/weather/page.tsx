'use client';

import { useState } from 'react';
import { CloudOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LocationSearch } from '@/components/weather/location-search';
import { WeatherHero } from '@/components/weather/weather-hero';
import { HourlyStrip } from '@/components/weather/hourly-strip';
import { ForecastCards } from '@/components/weather/forecast-cards';
import { AstronomyCard } from '@/components/weather/astronomy-card';
import { AlertsBanner } from '@/components/weather/alerts-banner';
import { SportsCard } from '@/components/weather/sports-card';
import { MarineCard } from '@/components/weather/marine-card';
import { useWeatherOverview } from '@/hooks/useWeather';

export default function WeatherPage() {
  const [location, setLocation] = useState('Mumbai');
  const [label, setLabel] = useState('Mumbai');
  const { data, isLoading, isError, error } = useWeatherOverview(location);

  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
  const today = data?.forecast?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Weather &amp; Planning</h1>
          <p className="text-sm text-muted-foreground">
            Plan studies, outings, and trips around the forecast — {label}
          </p>
        </div>
        <LocationSearch
          onSelect={(loc, lbl) => {
            setLocation(loc);
            setLabel(lbl);
          }}
        />
      </div>

      {status === 503 && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <CloudOff className="h-5 w-5" />
            Weather is not configured yet. Set <code className="mx-1">WEATHER_API_KEY</code> on the
            API to enable live data.
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-muted-foreground">Loading weather…</p>}

      {isError && status !== 503 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Could not load weather for this location. Try another search.
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {data.alerts.length > 0 && <AlertsBanner alerts={data.alerts} />}

          <WeatherHero current={data.current} today={today} />

          {today?.hours && today.hours.length > 0 && <HourlyStrip hours={today.hours} />}

          <ForecastCards days={data.forecast} />

          <div className="grid gap-6 lg:grid-cols-2">
            {today?.astro && <AstronomyCard astro={today.astro} />}
            <SportsCard sports={data.sports} />
          </div>

          <MarineCard location={location} />
        </>
      )}
    </div>
  );
}
