import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { startOfDay, endOfDay } from 'date-fns';

export function useDashboardStats() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['dashboard_stats', profile?.id],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      let patientQuery = supabase.from('patients').select('id', { count: 'exact', head: true });
      let aptTodayQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', todayStart).lte('date', todayEnd);
      let aptPendingQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      let aptCompletedQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed');

      if (profile?.role === 'doctor') {
        patientQuery = patientQuery.eq('created_by', profile.id);
        aptTodayQuery = aptTodayQuery.eq('doctor_id', profile.id);
        aptPendingQuery = aptPendingQuery.eq('doctor_id', profile.id);
        aptCompletedQuery = aptCompletedQuery.eq('doctor_id', profile.id);
      }

      const [patients, today, pending, completed] = await Promise.all([
        patientQuery,
        aptTodayQuery,
        aptPendingQuery,
        aptCompletedQuery
      ]);

      return {
        total_patients: patients.count || 0,
        appointments_today: today.count || 0,
        pending_appointments: pending.count || 0,
        completed_appointments: completed.count || 0,
      };
    },
    enabled: !!profile,
  });
}
