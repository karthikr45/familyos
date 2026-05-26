import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CurrentWeatherDto,
  ForecastDayDto,
  WeatherForecastDto,
  WeatherLocationDto,
} from '@familyos/shared';
import { RedisService } from '../../redis/redis.service';

const BASE_URL = 'https://api.weatherapi.com/v1';
const CURRENT_TTL = 600; // 10 minutes
const FORECAST_TTL = 1800; // 30 minutes

/** Raw weatherapi.com response shapes (only the fields we consume). */
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
}
interface RawCurrent {
  temp_c: number;
  feelslike_c: number;
  condition: RawCondition;
  humidity: number;
  wind_kph: number;
  precip_mm: number;
  uv: number;
  is_day: number;
  last_updated: string;
}
interface RawForecastDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    daily_chance_of_rain: number;
    condition: RawCondition;
  };
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

  private ensureConfigured(): void {
    if (!this.apiKey) {
      throw new HttpException(
        'Weather service is not configured (missing WEATHER_API_KEY)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams({ key: this.apiKey, aqi: 'no', ...params }).toString();
    const res = await fetch(`${BASE_URL}/${path}?${query}`);
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.warn(`weatherapi ${path} failed (${res.status}): ${detail}`);
      throw new HttpException(
        res.status === 400 ? 'Unknown location' : 'Weather provider error',
        res.status === 400 ? HttpStatus.BAD_REQUEST : HttpStatus.BAD_GATEWAY,
      );
    }
    return (await res.json()) as T;
  }

  private mapLocation(location: RawLocation): WeatherLocationDto {
    return {
      name: location.name,
      region: location.region,
      country: location.country,
      localtime: location.localtime,
    };
  }

  private mapCurrent(location: RawLocation, current: RawCurrent): CurrentWeatherDto {
    return {
      location: this.mapLocation(location),
      tempC: current.temp_c,
      feelsLikeC: current.feelslike_c,
      condition: current.condition,
      humidity: current.humidity,
      windKph: current.wind_kph,
      precipMm: current.precip_mm,
      uv: current.uv,
      isDay: current.is_day === 1,
      lastUpdated: current.last_updated,
    };
  }

  async getCurrent(location: string): Promise<CurrentWeatherDto> {
    this.ensureConfigured();
    const key = `weather:current:${location.toLowerCase()}`;
    return this.redis.remember(key, CURRENT_TTL, async () => {
      const data = await this.fetchJson<{ location: RawLocation; current: RawCurrent }>(
        'current.json',
        { q: location },
      );
      return this.mapCurrent(data.location, data.current);
    });
  }

  async getForecast(location: string, days = 3): Promise<WeatherForecastDto> {
    this.ensureConfigured();
    const safeDays = Math.min(Math.max(days, 1), 7);
    const key = `weather:forecast:${location.toLowerCase()}:${safeDays}`;
    return this.redis.remember(key, FORECAST_TTL, async () => {
      const data = await this.fetchJson<{
        location: RawLocation;
        current: RawCurrent;
        forecast: { forecastday: RawForecastDay[] };
      }>('forecast.json', { q: location, days: String(safeDays), alerts: 'no' });

      const forecast: ForecastDayDto[] = data.forecast.forecastday.map((d) => ({
        date: d.date,
        maxTempC: d.day.maxtemp_c,
        minTempC: d.day.mintemp_c,
        avgTempC: d.day.avgtemp_c,
        condition: d.day.condition,
        chanceOfRain: d.day.daily_chance_of_rain,
      }));

      return {
        location: this.mapLocation(data.location),
        current: this.mapCurrent(data.location, data.current),
        forecast,
      };
    });
  }
}
