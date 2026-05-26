'use client';

import { Moon, Sunrise, Sunset } from 'lucide-react';
import type { AstroDto } from '@familyos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function parseTime(t: string): number | null {
  // weatherapi returns e.g. "06:12 AM"
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if ((m[3] ?? '').toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

export function AstronomyCard({ astro }: { astro: AstroDto }) {
  const sr = parseTime(astro.sunrise);
  const ss = parseTime(astro.sunset);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let progress = 0;
  if (sr !== null && ss !== null && ss > sr) {
    progress = Math.max(0, Math.min(1, (nowMin - sr) / (ss - sr)));
  }
  // Position along a semicircular arc (svg viewBox 0..200 x, 0..100 y).
  const angle = Math.PI * (1 - progress);
  const sunX = 100 + 90 * Math.cos(angle);
  const sunY = 95 - 80 * Math.sin(angle);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sun &amp; Moon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <svg viewBox="0 0 200 100" className="h-24 w-full">
          <path
            d="M10 95 A 90 80 0 0 1 190 95"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {progress > 0 && progress < 1 && <circle cx={sunX} cy={sunY} r="7" fill="#f59e0b" />}
          <line x1="10" y1="95" x2="190" y2="95" stroke="hsl(var(--border))" strokeWidth="1" />
        </svg>

        <div className="flex justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Sunrise className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sunrise</p>
              <p className="font-semibold">{astro.sunrise}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sunset className="h-4 w-4 text-orange-500" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sunset</p>
              <p className="font-semibold">{astro.sunset}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm font-semibold">{astro.moonPhase}</p>
              <p className="text-xs text-muted-foreground">{astro.moonIllumination}% illuminated</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Rise {astro.moonrise}</p>
            <p>Set {astro.moonset}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
