'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIpLocation, useLocationSearch } from '@/hooks/useWeather';

interface Props {
  onSelect: (location: string, label: string) => void;
}

export function LocationSearch({ onSelect }: Props) {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: results } = useLocationSearch(debounced);
  const ip = useIpLocation();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search city, area, or postcode…"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Use my location"
          title="Use my location"
          onClick={() => {
            const byIp = () =>
              ip.refetch().then((res) => {
                const loc = res.data;
                if (loc?.city) onSelect(`${loc.lat},${loc.lon}`, `${loc.city}, ${loc.region}`);
              });
            // Prefer precise browser geolocation; fall back to IP lookup.
            if (typeof navigator !== 'undefined' && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => onSelect(`${pos.coords.latitude},${pos.coords.longitude}`, 'My location'),
                () => void byIp(),
              );
            } else {
              void byIp();
            }
          }}
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {open && (results?.length ?? 0) > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
          {results!.slice(0, 8).map((r) => (
            <button
              key={r.id}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
              onClick={() => {
                onSelect(`${r.lat},${r.lon}`, `${r.name}, ${r.region || r.country}`);
                setText(r.name);
                setOpen(false);
              }}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {r.name}
                <span className="text-muted-foreground">
                  {' '}
                  · {r.region ? `${r.region}, ` : ''}
                  {r.country}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
