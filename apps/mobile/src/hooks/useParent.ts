import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useCurrentUser } from './useAuth';

interface FamilyRow {
  id: string;
  name: string;
}

export function useFamilies() {
  return useQuery({
    queryKey: ['families'],
    queryFn: () => unwrap<FamilyRow[]>(api.get('/users/family')),
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
  alerts: { id: string; title: string; body: string }[];
  monthSpend: number;
}

export function useParentDashboard() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: ['parent-dashboard', user?.id],
    queryFn: () => unwrap<ParentDashboard>(api.get(`/parents/${user?.id}/dashboard`)),
    enabled: !!user?.id,
  });
}
