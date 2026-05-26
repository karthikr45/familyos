import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import type { AstronomyDto, WeatherOverviewDto } from '@familyos/shared';

export function useWeatherOverview(location: string) {
  return useQuery({
    queryKey: ['weather', 'overview', location],
    queryFn: () =>
      unwrap<WeatherOverviewDto>(api.get('/weather/overview', { params: { location } })),
    enabled: !!location,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useAstronomy(location: string) {
  return useQuery({
    queryKey: ['weather', 'astronomy', location],
    queryFn: () => unwrap<AstronomyDto>(api.get('/weather/astronomy', { params: { location } })),
    enabled: !!location,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
