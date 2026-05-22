'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, HeartPulse, LayoutDashboard, Settings, Users, Wallet } from 'lucide-react';
import { cn } from '@familyos/ui';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/children', label: 'Children', icon: Users },
  { href: '/finance', label: 'Finance', icon: Wallet },
  { href: '/family', label: 'Family', icon: CalendarDays },
  { href: '/wellness', label: 'Wellness', icon: HeartPulse },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card p-4 md:block">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold text-primary">FamilyOS</span>
      </div>
      <nav className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
