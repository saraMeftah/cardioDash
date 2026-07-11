import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  format, subDays, subWeeks, startOfWeek, eachWeekOfInterval,
  eachDayOfInterval, startOfDay, parseISO
} from 'date-fns';

export function useAnalyticsData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [patientsRes, appointmentsRes] = await Promise.all([
        supabase.from('patients').select('id, full_name, age, gender, diagnosis, created_at').order('created_at'),
        supabase.from('appointments').select('id, date, status').order('date'),
      ]);

      const patients = patientsRes.data || [];
      const appointments = appointmentsRes.data || [];

      // ── Patients over last 12 weeks ──────────────────────────────────
      const now = new Date();
      const twelveWeeksAgo = subWeeks(now, 12);
      const weeks = eachWeekOfInterval({ start: twelveWeeksAgo, end: now });

      const patientsOverTime = weeks.map(week => {
        const label = format(week, 'MMM d');
        const count = patients.filter(p => {
          const d = parseISO(p.created_at);
          return d >= week && d < new Date(week.getTime() + 7 * 24 * 60 * 60 * 1000);
        }).length;
        return { week: label, patients: count };
      });

      // ── Appointments over last 14 days ────────────────────────────────
      const fourteenDaysAgo = subDays(now, 13);
      const days = eachDayOfInterval({ start: fourteenDaysAgo, end: now });
      const appointmentsOverTime = days.map(day => {
        const label = format(day, 'MMM d');
        const dayStr = format(day, 'yyyy-MM-dd');
        const count = appointments.filter(a => a.date?.startsWith(dayStr)).length;
        return { day: label, appointments: count };
      });

      // ── Status distribution ───────────────────────────────────────────
      const statusMap: Record<string, number> = { pending: 0, completed: 0, cancelled: 0 };
      appointments.forEach(a => { if (a.status) statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
      const appointmentStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));


      // ── Gender distribution ────────────────────────────────────────────
      const genderMap: Record<string, number> = {};
      patients.forEach(p => {
        const g = p.gender || 'unknown';
        genderMap[g] = (genderMap[g] || 0) + 1;
      });
      const genderDistribution = Object.entries(genderMap).map(([name, value]) => ({ name, value }));

      // ── Diagnosis distribution ────────────────────────────────────────
      const diagMap: Record<string, number> = {};
      patients.forEach(p => {
        if (p.diagnosis) {
          const key = p.diagnosis.split(/[,;]/)[0].trim().slice(0, 40);
          diagMap[key] = (diagMap[key] || 0) + 1;
        }
      });
      const diagDistribution = Object.entries(diagMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);


      return {
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        completedAppointments: statusMap.completed,
        pendingAppointments: statusMap.pending,

        patientsOverTime,
        appointmentsOverTime,
        appointmentStatus,

        genderDistribution,
        diagDistribution,
      };
    },
    enabled: !!user,
  });
}
