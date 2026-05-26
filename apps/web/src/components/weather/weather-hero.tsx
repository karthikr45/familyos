'use client';

import { Droplets, Eye, Gauge, Sparkles, Sun, Wind } from 'lucide-react';
import type { CurrentWeatherDto, ForecastDayDto } from '@familyos/shared';
import { icon, todayOutdoorScore, uvLabel } from '@/lib/weather';
import { weatherGradient } from '@/lib/weather';

export function WeatherHero({
  current,
  today,
}: {
  current: CurrentWeatherDto;
  today?: ForecastDayDto;
}) {
  const gradient = weatherGradient(current.condition.code, current.isDay);
  const { score, verdict } = todayOutdoorScore(current, today);
  const uv = uvLabel(current.uv);
  const localTime = new Date(current.location.localtime.replace(' ', 'T'));

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl sm:p-8`}
    >
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-white/80">
            {current.location.name}
            {current.location.region ? `, ${current.location.region}` : ''}
          </p>
          <p className="text-xs text-white/60">
            {Number.isNaN(localTime.getTime())
              ? current.location.country
              : localTime.toLocaleString('en-IN', {
                  weekday: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-6xl font-bold leading-none">{Math.round(current.tempC)}°</span>
            {current.condition.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={icon(current.condition.icon)}
                alt={current.condition.text}
                width={72}
                height={72}
                className="drop-shadow"
              />
            )}
          </div>
          <p className="mt-1 text-lg font-medium capitalize">{current.condition.text}</p>
          <p className="text-sm text-white/80">Feels like {Math.round(current.feelsLikeC)}°C</p>
        </div>

        <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> Outdoor score
          </div>
          <p className="mt-1 text-3xl font-bold">{score}</p>
          <p className="text-xs text-white/80">{verdict}</p>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <HeroStat
          icon={<Sun className="h-4 w-4" />}
          label="UV"
          value={`${current.uv} · ${uv.label}`}
        />
        <HeroStat
          icon={<Droplets className="h-4 w-4" />}
          label="Humidity"
          value={`${current.humidity}%`}
        />
        <HeroStat
          icon={<Wind className="h-4 w-4" />}
          label="Wind"
          value={`${Math.round(current.windKph)} kph`}
        />
        <HeroStat
          icon={<Gauge className="h-4 w-4" />}
          label="Pressure"
          value={`${Math.round(current.pressureMb)} mb`}
        />
        <HeroStat
          icon={<Eye className="h-4 w-4" />}
          label="Visibility"
          value={`${current.visKm} km`}
        />
        <HeroStat
          icon={<Droplets className="h-4 w-4" />}
          label="Precip"
          value={`${current.precipMm} mm`}
        />
      </div>
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-white/80">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
