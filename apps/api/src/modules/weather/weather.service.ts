import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AstroDto,
  AstronomyDto,
  CurrentWeatherDto,
  ForecastDayDto,
  HourlyWeatherDto,
  IpLookupDto,
  LocationSearchResultDto,
  MarineForecastDto,
  SportsDto,
  TimezoneDto,
  WeatherAlertDto,
  WeatherForecastDto,
  WeatherLocationDto,
  WeatherOverviewDto,
} from '@familyos/shared';
import { RedisService } from '../../redis/redis.service';

const BASE_URL = 'https://api.weatherapi.com/v1';

const TTL = {
  current: 600, // 10m
  forecast: 1800, // 30m
  astronomy: 6 * 3600, // 6h
  alerts: 900, // 15m
  marine: 1800,
  history: 24 * 3600,
  future: 12 * 3600,
  sports: 3600,
  timezone: 24 * 3600,
  search: 3600,
} as const;

// ---- raw weatherapi.com shapes (only consumed fields) ----------------------
interface RawCondition {
  text: string;
  icon: string;
  code: number;
}
interface RawLocation {
  name: string;
  region: string;
  country: string;
  localtime: string;
  lat?: number;
  lon?: number;
  tz_id?: string;
}
interface RawCurrent {
  temp_c: number;
  feelslike_c: number;
  condition: RawCondition;
  humidity: number;
  wind_kph: number;
  wind_dir: string;
  precip_mm: number;
  pressure_mb: number;
  vis_km: number;
  cloud: number;
  uv: number;
  gust_kph: number;
  is_day: number;
  last_updated: string;
}
interface RawAstro {
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  moon_phase: string;
  moon_illumination: number | string;
  is_sun_up?: number;
  is_moon_up?: number;
}
interface RawHour {
  time: string;
  temp_c: number;
  feelslike_c: number;
  condition: RawCondition;
  chance_of_rain: number;
  wind_kph: number;
  humidity: number;
  is_day: number;
  sig_ht_mt?: number;
  swell_ht_mt?: number;
  swell_period_secs?: number;
  water_temp_c?: number;
}
interface RawForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    avghumidity: number;
    daily_chance_of_rain: number;
    uv: number;
    condition: RawCondition;
  };
  astro: RawAstro;
  hour: RawHour[];
  tides?: { tide: { tide_time: string; tide_height_mt: string; tide_type: string }[] }[];
}
interface RawAlert {
  headline: string;
  severity: string;
  urgency: string;
  event: string;
  areas: string;
  effective: string;
  expires: string;
  desc: string;
  instruction: string;
}
interface RawSportEvent {
  stadium: string;
  country: string;
  region: string;
  tournament: string;
  start: string;
  match: string;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;

  constructor(
    config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.apiKey = config.get<string>('weather.apiKey') ?? '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private ensureConfigured(): void {
    if (!this.apiKey) {
      throw new HttpException(
        'Weather service is not configured (missing WEATHER_API_KEY)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams({ key: this.apiKey, ...params }).toString();
    const res = await fetch(`${BASE_URL}/${path}?${query}`);
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.warn(`weatherapi ${path} failed (${res.status}): ${detail.slice(0, 200)}`);
      if (res.status === 400) throw new HttpException('Unknown location', HttpStatus.BAD_REQUEST);
      if (res.status === 403)
        throw new HttpException(
          'This weather endpoint is not available on the current plan',
          HttpStatus.FORBIDDEN,
        );
      throw new HttpException('Weather provider error', HttpStatus.BAD_GATEWAY);
    }
    return (await res.json()) as T;
  }

  // ---- mappers -------------------------------------------------------------

  private mapLocation(l: RawLocation): WeatherLocationDto {
    return {
      name: l.name,
      region: l.region,
      country: l.country,
      localtime: l.localtime,
      lat: l.lat,
      lon: l.lon,
      tzId: l.tz_id,
    };
  }

  private mapCurrent(l: RawLocation, c: RawCurrent): CurrentWeatherDto {
    return {
      location: this.mapLocation(l),
      tempC: c.temp_c,
      feelsLikeC: c.feelslike_c,
      condition: c.condition,
      humidity: c.humidity,
      windKph: c.wind_kph,
      windDir: c.wind_dir,
      precipMm: c.precip_mm,
      pressureMb: c.pressure_mb,
      visKm: c.vis_km,
      cloud: c.cloud,
      uv: c.uv,
      gustKph: c.gust_kph,
      isDay: c.is_day === 1,
      lastUpdated: c.last_updated,
    };
  }

  private mapAstro(a: RawAstro): AstroDto {
    return {
      sunrise: a.sunrise,
      sunset: a.sunset,
      moonrise: a.moonrise,
      moonset: a.moonset,
      moonPhase: a.moon_phase,
      moonIllumination: Number(a.moon_illumination) || 0,
      isSunUp: a.is_sun_up === 1,
      isMoonUp: a.is_moon_up === 1,
    };
  }

  private mapHour(h: RawHour): HourlyWeatherDto {
    return {
      time: h.time,
      tempC: h.temp_c,
      feelsLikeC: h.feelslike_c,
      condition: h.condition,
      chanceOfRain: h.chance_of_rain,
      windKph: h.wind_kph,
      humidity: h.humidity,
      isDay: h.is_day === 1,
    };
  }

  private mapDay(d: RawForecastDay, withHours = true): ForecastDayDto {
    return {
      date: d.date,
      maxTempC: d.day.maxtemp_c,
      minTempC: d.day.mintemp_c,
      avgTempC: d.day.avgtemp_c,
      condition: d.day.condition,
      chanceOfRain: d.day.daily_chance_of_rain,
      maxWindKph: d.day.maxwind_kph,
      totalPrecipMm: d.day.totalprecip_mm,
      avgHumidity: d.day.avghumidity,
      uv: d.day.uv,
      astro: d.astro ? this.mapAstro(d.astro) : undefined,
      hours: withHours && d.hour ? d.hour.map((h) => this.mapHour(h)) : undefined,
    };
  }

  private mapAlerts(alerts?: { alert?: RawAlert[] }): WeatherAlertDto[] {
    if (!alerts?.alert) return [];
    return alerts.alert
      .filter((a) => a.headline || a.event)
      .map((a) => ({
        headline: a.headline,
        severity: a.severity,
        urgency: a.urgency,
        event: a.event,
        areas: a.areas,
        effective: a.effective,
        expires: a.expires,
        description: a.desc,
        instruction: a.instruction,
      }));
  }

  // ---- public API ----------------------------------------------------------

  async getCurrent(location: string): Promise<CurrentWeatherDto> {
    this.ensureConfigured();
    return this.redis.remember(
      `weather:current:${location.toLowerCase()}`,
      TTL.current,
      async () => {
        const data = await this.fetchJson<{ location: RawLocation; current: RawCurrent }>(
          'current.json',
          { q: location, aqi: 'no' },
        );
        return this.mapCurrent(data.location, data.current);
      },
    );
  }

  async getForecast(location: string, days = 3): Promise<WeatherForecastDto> {
    this.ensureConfigured();
    const safeDays = Math.min(Math.max(days, 1), 7);
    return this.redis.remember(
      `weather:forecast:${location.toLowerCase()}:${safeDays}`,
      TTL.forecast,
      async () => {
        const data = await this.fetchJson<{
          location: RawLocation;
          current: RawCurrent;
          forecast: { forecastday: RawForecastDay[] };
          alerts?: { alert?: RawAlert[] };
        }>('forecast.json', { q: location, days: String(safeDays), aqi: 'no', alerts: 'yes' });
        return {
          location: this.mapLocation(data.location),
          current: this.mapCurrent(data.location, data.current),
          forecast: data.forecast.forecastday.map((d) => this.mapDay(d)),
          alerts: this.mapAlerts(data.alerts),
        };
      },
    );
  }

  async getAstronomy(location: string, date?: string): Promise<AstronomyDto> {
    this.ensureConfigured();
    const dt = date ?? new Date().toISOString().slice(0, 10);
    return this.redis.remember(
      `weather:astro:${location.toLowerCase()}:${dt}`,
      TTL.astronomy,
      async () => {
        const data = await this.fetchJson<{
          location: RawLocation;
          astronomy: { astro: RawAstro };
        }>('astronomy.json', { q: location, dt });
        return {
          location: this.mapLocation(data.location),
          astro: this.mapAstro(data.astronomy.astro),
        };
      },
    );
  }

  async getAlerts(location: string): Promise<WeatherAlertDto[]> {
    this.ensureConfigured();
    return this.redis.remember(`weather:alerts:${location.toLowerCase()}`, TTL.alerts, async () => {
      const data = await this.fetchJson<{ alerts?: { alert?: RawAlert[] } }>('alerts.json', {
        q: location,
      });
      return this.mapAlerts(data.alerts);
    });
  }

  async getMarine(location: string, days = 3): Promise<MarineForecastDto> {
    this.ensureConfigured();
    const safeDays = Math.min(Math.max(days, 1), 7);
    return this.redis.remember(
      `weather:marine:${location.toLowerCase()}:${safeDays}`,
      TTL.marine,
      async () => {
        const data = await this.fetchJson<{
          location: RawLocation;
          forecast: { forecastday: RawForecastDay[] };
        }>('marine.json', { q: location, days: String(safeDays) });
        return {
          location: this.mapLocation(data.location),
          days: data.forecast.forecastday.map((d) => ({
            date: d.date,
            maxTempC: d.day.maxtemp_c,
            minTempC: d.day.mintemp_c,
            condition: d.day.condition,
            tides: (d.tides?.[0]?.tide ?? []).map((t) => ({
              time: t.tide_time,
              heightMt: Number(t.tide_height_mt) || 0,
              type: t.tide_type,
            })),
            hours: (d.hour ?? []).map((h) => ({
              time: h.time,
              sigHeightMt: h.sig_ht_mt ?? 0,
              swellHeightMt: h.swell_ht_mt ?? 0,
              swellPeriodSecs: h.swell_period_secs ?? 0,
              waterTempC: h.water_temp_c ?? 0,
              windKph: h.wind_kph,
            })),
          })),
        };
      },
    );
  }

  async getHistory(location: string, date: string): Promise<WeatherForecastDto> {
    this.ensureConfigured();
    return this.redis.remember(
      `weather:history:${location.toLowerCase()}:${date}`,
      TTL.history,
      async () => {
        const data = await this.fetchJson<{
          location: RawLocation;
          forecast: { forecastday: RawForecastDay[] };
        }>('history.json', { q: location, dt: date });
        const first = data.forecast.forecastday[0];
        return {
          location: this.mapLocation(data.location),
          current: this.mapCurrent(data.location, {
            temp_c: first?.day.avgtemp_c ?? 0,
            feelslike_c: first?.day.avgtemp_c ?? 0,
            condition: first?.day.condition ?? { text: '', icon: '', code: 0 },
            humidity: first?.day.avghumidity ?? 0,
            wind_kph: first?.day.maxwind_kph ?? 0,
            wind_dir: '',
            precip_mm: first?.day.totalprecip_mm ?? 0,
            pressure_mb: 0,
            vis_km: 0,
            cloud: 0,
            uv: first?.day.uv ?? 0,
            gust_kph: 0,
            is_day: 1,
            last_updated: first?.date ?? date,
          }),
          forecast: data.forecast.forecastday.map((d) => this.mapDay(d)),
          alerts: [],
        };
      },
    );
  }

  async getFuture(location: string, date: string): Promise<ForecastDayDto> {
    this.ensureConfigured();
    return this.redis.remember(
      `weather:future:${location.toLowerCase()}:${date}`,
      TTL.future,
      async () => {
        const data = await this.fetchJson<{ forecast: { forecastday: RawForecastDay[] } }>(
          'future.json',
          { q: location, dt: date },
        );
        const day = data.forecast.forecastday[0];
        if (!day) throw new HttpException('No future data for that date', HttpStatus.BAD_REQUEST);
        return this.mapDay(day, false);
      },
    );
  }

  async getSports(location: string): Promise<SportsDto> {
    this.ensureConfigured();
    return this.redis.remember(`weather:sports:${location.toLowerCase()}`, TTL.sports, async () => {
      const data = await this.fetchJson<{
        football?: RawSportEvent[];
        cricket?: RawSportEvent[];
        golf?: RawSportEvent[];
      }>('sports.json', { q: location });
      const map = (events?: RawSportEvent[]) =>
        (events ?? []).map((e) => ({
          stadium: e.stadium,
          country: e.country,
          region: e.region,
          tournament: e.tournament,
          start: e.start,
          match: e.match,
        }));
      return { football: map(data.football), cricket: map(data.cricket), golf: map(data.golf) };
    });
  }

  async getTimezone(location: string): Promise<TimezoneDto> {
    this.ensureConfigured();
    return this.redis.remember(`weather:tz:${location.toLowerCase()}`, TTL.timezone, async () => {
      const data = await this.fetchJson<{ location: RawLocation }>('timezone.json', {
        q: location,
      });
      return {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        tzId: data.location.tz_id ?? '',
        localtime: data.location.localtime,
      };
    });
  }

  async search(query: string): Promise<LocationSearchResultDto[]> {
    this.ensureConfigured();
    if (query.trim().length < 2) return [];
    return this.redis.remember(`weather:search:${query.toLowerCase()}`, TTL.search, async () => {
      const data = await this.fetchJson<LocationSearchResultDto[]>('search.json', { q: query });
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        region: r.region,
        country: r.country,
        lat: r.lat,
        lon: r.lon,
      }));
    });
  }

  async lookupIp(ip = 'auto:ip'): Promise<IpLookupDto> {
    this.ensureConfigured();
    const data = await this.fetchJson<{
      ip: string;
      city: string;
      region: string;
      country_name: string;
      lat: number;
      lon: number;
      tz_id: string;
    }>('ip.json', { q: ip });
    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      lat: data.lat,
      lon: data.lon,
      tzId: data.tz_id,
    };
  }

  /** Aggregated payload powering the premium weather page in one round-trip. */
  async getOverview(location: string): Promise<WeatherOverviewDto> {
    this.ensureConfigured();
    return this.redis.remember(
      `weather:overview:${location.toLowerCase()}`,
      TTL.current,
      async () => {
        const [forecast, sports] = await Promise.all([
          this.getForecast(location, 3),
          this.getSports(location).catch(() => ({ football: [], cricket: [], golf: [] })),
        ]);
        return {
          location: forecast.location,
          current: forecast.current,
          forecast: forecast.forecast,
          alerts: forecast.alerts,
          sports,
        };
      },
    );
  }
}
