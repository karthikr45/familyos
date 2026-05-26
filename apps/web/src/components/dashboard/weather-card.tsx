'use client';

import { useState } from 'react';
import { Cloud, Droplets, Search, Sun, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWeatherForecast } from '@/hooks/useWeather';
import { formatDate } from '@familyos/shared';

export function WeatherCard({ defaultLocation = 'Mumbai' }: { defaultLocation?: string }) {
  const [location, setLocation] = useState(defaultLocation);
  const [query, setQuery] = useState(defaultLocation);
  const { data, isLoading, isError } = useWeatherForecast(query, 3);

  const current = data?.current;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="h-4 w-4 text-primary" /> Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(location.trim());
          }}
        >
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, area, or postcode"
            className="h-9"
          />
          <Button type="submit" size="icon" variant="outline" aria-label="Search weather">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {isLoading && <p className="text-sm text-muted-foreground">Loading weather…</p>}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Weather unavailable. Check the location or that WEATHER_API_KEY is set.
          </p>
        )}

        {current && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {current.location.name}, {current.location.region || current.location.country}
                </p>
                <p className="text-4xl font-bold">{Math.round(current.tempC)}°C</p>
                <p className="text-sm capitalize">{current.condition.text}</p>
              </div>
              {current.condition.icon && (
                // weatherapi returns protocol-relative icon URLs
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https:${current.condition.icon}`}
                  alt={current.condition.text}
                  width={64}
                  height={64}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <Stat
                icon={<Sun className="h-4 w-4" />}
                label="Feels like"
                value={`${Math.round(current.feelsLikeC)}°`}
              />
              <Stat
                icon={<Droplets className="h-4 w-4" />}
                label="Humidity"
                value={`${current.humidity}%`}
              />
              <Stat
                icon={<Wind className="h-4 w-4" />}
                label="Wind"
                value={`${Math.round(current.windKph)} kph`}
              />
            </div>

            <div className="flex justify-between gap-2 border-t pt-3">
              {(data?.forecast ?? []).map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(day.date, 'weekday').split(' ')[0]}
                  </p>
                  {day.condition.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https:${day.condition.icon}`}
                      alt={day.condition.text}
                      width={36}
                      height={36}
                      className="mx-auto"
                    />
                  )}
                  <p className="text-xs font-medium">
                    {Math.round(day.maxTempC)}° / {Math.round(day.minTempC)}°
                  </p>
                  <p className="text-[10px] text-muted-foreground">{day.chanceOfRain}% rain</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-2 text-center">
      <div className="flex items-center justify-center text-muted-foreground">{icon}</div>
      <p className="mt-1 font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
