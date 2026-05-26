import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Muted } from '../components/shared/ui';
import { useWeatherOverview } from '../hooks/useWeather';
import {
  heroColor,
  hourLabel,
  icon,
  outdoorScore,
  shortDay,
  todayOutdoorScore,
  uvLabel,
} from '../lib/weather';
import { formatDate } from '@familyos/shared';

export default function Weather() {
  const router = useRouter();
  const [location, setLocation] = useState('Mumbai');
  const [input, setInput] = useState('');
  const { data, isLoading, isError, error } = useWeatherOverview(location);
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;

  const current = data?.current;
  const today = data?.forecast?.[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()}>
            <Text className="text-primary">← Back</Text>
          </Pressable>
          <Text className="text-base font-semibold text-gray-900">Weather</Text>
          <View style={{ width: 48 }} />
        </View>

        <TextInput
          className="h-11 rounded-xl border border-gray-300 bg-white px-4"
          placeholder="Search a city…"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => input.trim() && setLocation(input.trim())}
          returnKeyType="search"
        />

        {status === 503 && (
          <Card>
            <Muted>Weather isn&apos;t configured yet. Ask an admin to set WEATHER_API_KEY.</Muted>
          </Card>
        )}
        {isLoading && <ActivityIndicator color="#4f46e5" />}
        {isError && status !== 503 && (
          <Card>
            <Muted>Couldn&apos;t load weather. Try another city.</Muted>
          </Card>
        )}

        {(data?.alerts ?? []).map((a, i) => (
          <View key={i} className="rounded-2xl border border-red-300 bg-red-50 p-4">
            <Text className="font-semibold text-red-800">{a.event || a.headline}</Text>
            {!!a.areas && <Text className="text-xs text-red-700">{a.areas}</Text>}
          </View>
        ))}

        {current && (
          <View
            className="rounded-3xl p-5"
            style={{ backgroundColor: heroColor(current.condition.code, current.isDay) }}
          >
            <Text className="text-sm text-white/80">
              {current.location.name}
              {current.location.region ? `, ${current.location.region}` : ''}
            </Text>
            <View className="mt-2 flex-row items-center">
              <Text className="text-6xl font-bold text-white">{Math.round(current.tempC)}°</Text>
              {!!current.condition.icon && (
                <Image
                  source={{ uri: icon(current.condition.icon) }}
                  style={{ width: 72, height: 72 }}
                />
              )}
            </View>
            <Text className="text-lg font-medium capitalize text-white">
              {current.condition.text}
            </Text>
            <Text className="text-sm text-white/80">
              Feels like {Math.round(current.feelsLikeC)}°C
            </Text>

            <View className="mt-4 flex-row justify-between rounded-2xl bg-white/15 p-3">
              <Stat label="Outdoor" value={`${todayOutdoorScore(current, today).score}`} />
              <Stat label="UV" value={uvLabel(current.uv)} />
              <Stat label="Humidity" value={`${current.humidity}%`} />
              <Stat label="Wind" value={`${Math.round(current.windKph)} kph`} />
            </View>
          </View>
        )}

        {today?.hours && today.hours.length > 0 && (
          <Card>
            <Text className="mb-2 font-semibold text-gray-900">Hourly</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {today.hours
                  .filter(
                    (h) => new Date(h.time.replace(' ', 'T')).getTime() >= Date.now() - 3600_000,
                  )
                  .slice(0, 24)
                  .map((h) => (
                    <View key={h.time} className="items-center rounded-xl bg-gray-100 px-3 py-2">
                      <Text className="text-xs text-gray-500">{hourLabel(h.time)}</Text>
                      {!!h.condition.icon && (
                        <Image
                          source={{ uri: icon(h.condition.icon) }}
                          style={{ width: 36, height: 36 }}
                        />
                      )}
                      <Text className="text-sm font-semibold text-gray-900">
                        {Math.round(h.tempC)}°
                      </Text>
                      <Text className="text-[10px] text-blue-500">{h.chanceOfRain}%</Text>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {!!data?.forecast?.length && (
          <Card>
            <Text className="mb-2 font-semibold text-gray-900">
              {data.forecast.length}-day forecast
            </Text>
            {data.forecast.map((day, i) => {
              const { score, verdict } = outdoorScore(day);
              const tone =
                score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
              return (
                <View
                  key={day.date}
                  className="flex-row items-center justify-between border-b border-gray-100 py-2"
                >
                  <Text className="w-12 font-medium text-gray-900">
                    {i === 0 ? 'Today' : shortDay(day.date)}
                  </Text>
                  {!!day.condition.icon && (
                    <Image
                      source={{ uri: icon(day.condition.icon) }}
                      style={{ width: 36, height: 36 }}
                    />
                  )}
                  <Text className="flex-1 px-2 text-xs text-gray-500" numberOfLines={1}>
                    {verdict}
                  </Text>
                  <Text className={`mr-3 text-xs font-semibold ${tone}`}>{score}</Text>
                  <Text className="font-semibold text-gray-900">
                    {Math.round(day.maxTempC)}°/{Math.round(day.minTempC)}°
                  </Text>
                </View>
              );
            })}
          </Card>
        )}

        {today?.astro && (
          <Card>
            <Text className="mb-2 font-semibold text-gray-900">Sun &amp; Moon</Text>
            <View className="flex-row justify-between">
              <Muted>🌅 Sunrise {today.astro.sunrise}</Muted>
              <Muted>🌇 Sunset {today.astro.sunset}</Muted>
            </View>
            <Muted>
              🌙 {today.astro.moonPhase} · {today.astro.moonIllumination}% lit
            </Muted>
          </Card>
        )}

        {!!(data?.sports?.cricket.length || data?.sports?.football.length) && (
          <Card>
            <Text className="mb-2 font-semibold text-gray-900">Upcoming matches</Text>
            {[...(data?.sports.cricket ?? []), ...(data?.sports.football ?? [])]
              .slice(0, 5)
              .map((e, i) => (
                <View key={i} className="flex-row items-center justify-between py-1">
                  <Text className="flex-1 text-sm text-gray-900" numberOfLines={1}>
                    {e.match}
                  </Text>
                  <Muted>{formatDate(e.start, 'datetime')}</Muted>
                </View>
              ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-base font-bold text-white">{value}</Text>
      <Text className="text-[10px] text-white/80">{label}</Text>
    </View>
  );
}
