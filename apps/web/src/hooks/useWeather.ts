'use client';

import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type {
  AstronomyDto,
  IpLookupDto,
  LocationSearchResultDto,
  MarineForecastDto,
  SportsDto,
  WeatherForecastDto,
  WeatherOverviewDto,
} from '@familyos/shared';

export function useWeatherForecast(location: string, days = 3) {
  return useQuery({
    queryKey: ['weather', 'forecast', location, days],
    queryFn: () =>
      unwrap<WeatherForecastDto>(api.get('/weather/forecast', { params: { location, days } })),
    enabled: !!location,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

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

export function useMarine(location: string, enabled: boolean) {
  return useQuery({
    queryKey: ['weather', 'marine', location],
    queryFn: () => unwrap<MarineForecastDto>(api.get('/weather/marine', { params: { location } })),
    enabled: enabled && !!location,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useSports(location: string) {
  return useQuery({
    queryKey: ['weather', 'sports', location],
    queryFn: () => unwrap<SportsDto>(api.get('/weather/sports', { params: { location } })),
    enabled: !!location,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}

export function useLocationSearch(query: string) {
  return useQuery({
    queryKey: ['weather', 'search', query],
    queryFn: () =>
      unwrap<LocationSearchResultDto[]>(api.get('/weather/search', { params: { q: query } })),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}

export function useIpLocation() {
  return useQuery({
    queryKey: ['weather', 'ip'],
    queryFn: () => unwrap<IpLookupDto>(api.get('/weather/ip')),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
