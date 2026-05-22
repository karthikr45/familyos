'use client';

import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@familyos/shared';

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => unwrap<{ items: NotificationRow[] }>(api.get('/notifications')),
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
        )}
        {items.map((n) => (
          <Card key={n.id}>
            <CardContent className="flex items-start justify-between p-4">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(n.createdAt, 'datetime')}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
