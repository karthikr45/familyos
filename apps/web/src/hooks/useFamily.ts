'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useCurrentUser } from './useAuth';

interface FamilyLite {
  id: string;
  name: string;
  memberRole?: string;
}

/** Resolve the current parent's primary family id from /auth/me. */
export function useActiveFamilyId(): string | null {
  const { data } = useCurrentUser();
  const families = (data as unknown as { families?: FamilyLite[] })?.families;
  return families?.[0]?.id ?? null;
}

export function useChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: ['children', parentId],
    queryFn: () => unwrap<unknown[]>(api.get(`/parents/${parentId}/children`)),
    enabled: !!parentId,
  });
}

export function useParentDashboard(parentId: string | undefined) {
  return useQuery({
    queryKey: ['parent-dashboard', parentId],
    queryFn: () => unwrap<ParentDashboard>(api.get(`/parents/${parentId}/dashboard`)),
    enabled: !!parentId,
  });
}

export function useChildSummary(studentId: string) {
  return useQuery({
    queryKey: ['child-summary', studentId],
    queryFn: () => unwrap<unknown>(api.get(`/parents/child/${studentId}/summary`)),
    enabled: !!studentId,
  });
}

export function useCalendar(familyId: string | null) {
  return useQuery({
    queryKey: ['calendar', familyId],
    queryFn: () => unwrap<CalendarEvent[]>(api.get(`/family/${familyId}/calendar`)),
    enabled: !!familyId,
  });
}

export function useCreateEvent(familyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      unwrap(api.post(`/family/${familyId}/calendar`, body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar', familyId] }),
  });
}

export interface ParentDashboard {
  children: {
    id: string;
    name: string;
    class: number;
    board: string;
    weekStudyMinutes: number;
    lastExamScore: number | null;
    latestMood: string | null;
  }[];
  alerts: { id: string; title: string; body: string; type: string }[];
  upcomingEvents: CalendarEvent[];
  monthSpend: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
}
