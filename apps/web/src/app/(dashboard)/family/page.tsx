'use client';

import Link from 'next/link';
import { CalendarDays, Plane, Pizza, MapPin, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const LINKS = [
  { href: '/family/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/family/vacations', label: 'Vacations', icon: Plane },
  { href: '/family/outings', label: 'Outings', icon: MapPin },
  { href: '/family/dinners', label: 'Dinners', icon: Pizza },
  { href: '/family/photos', label: 'Photos', icon: ImageIcon },
];

export default function FamilyHubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Family Hub</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-6">
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
