'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import type { WeatherAlertDto } from '@familyos/shared';

function tone(severity: string): string {
  const s = severity.toLowerCase();
  if (s.includes('extreme') || s.includes('severe')) return 'border-red-300 bg-red-50 text-red-800';
  if (s.includes('moderate')) return 'border-amber-300 bg-amber-50 text-amber-800';
  return 'border-blue-300 bg-blue-50 text-blue-800';
}

export function AlertsBanner({ alerts }: { alerts: WeatherAlertDto[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={`${alert.event}-${i}`}
          className={`rounded-xl border p-4 ${tone(alert.severity)}`}
        >
          <button
            className="flex w-full items-start justify-between text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{alert.event || alert.headline}</p>
                {alert.areas && <p className="text-xs opacity-80">{alert.areas}</p>}
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="mt-3 space-y-2 text-sm">
              {alert.headline && <p className="font-medium">{alert.headline}</p>}
              {alert.description && <p className="opacity-90">{alert.description}</p>}
              {alert.instruction && (
                <p className="rounded-md bg-white/60 p-2 text-xs">
                  <span className="font-semibold">What to do: </span>
                  {alert.instruction}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
