'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChildren } from '@/hooks/useFamily';
import { useCurrentUser } from '@/hooks/useAuth';

interface ChildRow {
  id: string;
  name: string;
  class: number;
  board: string;
  school: string | null;
}

export default function ChildrenPage() {
  const { data: user } = useCurrentUser();
  const { data, isLoading } = useChildren(user?.id);
  const children = (data as ChildRow[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Children</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <Link key={child.id} href={`/children/${child.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  {child.name}
                  <Badge variant="secondary">Class {child.class}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {child.board} · {child.school ?? 'School not set'}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!isLoading && children.length === 0 && (
          <p className="text-sm text-muted-foreground">No children added yet.</p>
        )}
      </div>
    </div>
  );
}
