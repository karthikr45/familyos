'use client';

import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { WeatherForecastDto } from '@familyos/shared';

export function useWeatherForecast(location: string, days = 3) {
  return useQuery({
    queryKey: ['weather', location, days],
    queryFn: () =>
      unwrap<WeatherForecastDto>(api.get('/weather/forecast', { params: { location, days } })),
    enabled: !!location,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
