import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';

export interface StudentProfile {
  id: string;
  name: string;
  class: number;
  board: string;
}

export interface StudentDashboard {
  profile: StudentProfile;
  streak: number;
  weekStudyMinutes: number;
  dailyGoal: number;
  recentExams: { id: string; score: number; totalMarks: number }[];
}

export function useStudentProfile() {
  return useQuery({
    queryKey: ['student-profile'],
    queryFn: () => unwrap<StudentProfile>(api.get('/students/profile')),
  });
}

export function useStudentDashboard(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-dashboard', studentId],
    queryFn: () => unwrap<StudentDashboard>(api.get(`/students/${studentId}/dashboard`)),
    enabled: !!studentId,
  });
}
