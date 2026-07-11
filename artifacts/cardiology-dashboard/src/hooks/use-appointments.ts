import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Appointment } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { startOfDay, endOfDay, format } from 'date-fns';

export function useAppointments(date?: Date) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['appointments', date?.toISOString(), profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`*, patients(full_name)`)
        .order('date', { ascending: true });

      if (date) {
        query = query
          .gte('date', startOfDay(date).toISOString())
          .lte('date', endOfDay(date).toISOString());
      }

      if (profile?.role === 'doctor') {
        query = query.eq('doctor_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!profile,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (appointment: Partial<Appointment>) => {
      const { data, error } = await supabase.from('appointments').insert([
        { ...appointment, doctor_id: profile?.id }
      ]).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const updates: any = { status };
      if (status === 'in_progress') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
}
