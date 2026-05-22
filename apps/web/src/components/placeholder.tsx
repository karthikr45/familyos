import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming together</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description ??
            'This section is wired to the FamilyOS API and will render full details here.'}
        </CardContent>
      </Card>
    </div>
  );
}
