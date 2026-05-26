import type { CurrentWeatherDto, ForecastDayDto } from '@familyos/shared';

/** weatherapi.com condition-code buckets → a premium hero gradient. */
export function weatherGradient(code: number, isDay: boolean): string {
  if (!isDay) return 'from-slate-900 via-indigo-900 to-slate-800';

  const rain = [
    1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246,
  ];
  const thunder = [1087, 1273, 1276, 1279, 1282];
  const snow = [
    1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264,
  ];
  const fog = [1030, 1135, 1147];

  if (thunder.includes(code)) return 'from-slate-800 via-indigo-900 to-slate-900';
  if (rain.includes(code)) return 'from-slate-600 via-blue-700 to-blue-900';
  if (snow.includes(code)) return 'from-sky-300 via-sky-400 to-blue-500';
  if (fog.includes(code)) return 'from-slate-400 via-slate-500 to-slate-600';
  if (code === 1000) return 'from-amber-400 via-sky-500 to-blue-600'; // sunny
  return 'from-sky-500 via-sky-600 to-blue-700'; // cloudy / default
}

export function uvLabel(uv: number): { label: string; tone: string } {
  if (uv <= 2) return { label: 'Low', tone: 'text-emerald-600' };
  if (uv <= 5) return { label: 'Moderate', tone: 'text-amber-600' };
  if (uv <= 7) return { label: 'High', tone: 'text-orange-600' };
  if (uv <= 10) return { label: 'Very high', tone: 'text-red-600' };
  return { label: 'Extreme', tone: 'text-purple-700' };
}

/**
 * A family-friendly "is it a good day to be outdoors?" score (0–100), used to
 * tie weather into outing/activity planning.
 */
export function outdoorScore(day: ForecastDayDto): { score: number; verdict: string } {
  let score = 100;
  score -= Math.min(day.chanceOfRain, 100) * 0.6;
  if (day.maxTempC > 38) score -= (day.maxTempC - 38) * 5;
  if (day.maxTempC < 12) score -= (12 - day.maxTempC) * 4;
  if (day.uv >= 8) score -= 10;
  if (day.maxWindKph > 35) score -= 15;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const verdict =
    score >= 75
      ? 'Great for outdoor plans'
      : score >= 50
        ? 'Okay — pack for the weather'
        : 'Better to stay in';
  return { score, verdict };
}

export function todayOutdoorScore(current: CurrentWeatherDto, day?: ForecastDayDto) {
  if (day) return outdoorScore(day);
  return outdoorScore({
    date: '',
    maxTempC: current.tempC,
    minTempC: current.tempC,
    avgTempC: current.tempC,
    condition: current.condition,
    chanceOfRain: current.precipMm > 0 ? 60 : 10,
    maxWindKph: current.windKph,
    totalPrecipMm: current.precipMm,
    avgHumidity: current.humidity,
    uv: current.uv,
  });
}

export function shortDay(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

export function hourLabel(timeIso: string): string {
  const d = new Date(timeIso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
}

export function icon(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}
