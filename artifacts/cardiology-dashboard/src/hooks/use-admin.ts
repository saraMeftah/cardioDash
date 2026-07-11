import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type User } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useAllUsers() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as User[];
    },
    enabled: profile?.role === 'admin',
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'doctor' | 'assistant' | 'guest' }) => {
      const { error } = await supabase.from('users').update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('delete_staff_member', {
        target_uid: id,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
  });
}

export function useRecentActivity() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['recent_activity'],
    queryFn: async () => {
      const [patientsRes, appointmentsRes, recordsRes] = await Promise.all([
        supabase.from('patients').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('appointments').select('id, date, status, patients(full_name)').order('date', { ascending: false }).limit(10),
        supabase.from('medical_records').select('id, description, category, uploaded_at, patients(full_name)').order('uploaded_at', { ascending: false }).limit(10),
      ]);

      const events: Array<{ id: string; type: string; label: string; time: string }> = [];

      patientsRes.data?.forEach(p => {
        events.push({ id: `pt-${p.id}`, type: 'patient', label: `Patient added: ${p.full_name}`, time: p.created_at });
      });
      appointmentsRes.data?.forEach(a => {
        const pName = (a.patients as any)?.full_name || 'Unknown';
        events.push({ id: `ap-${a.id}`, type: 'appointment', label: `Appointment ${a.status}: ${pName}`, time: a.date });
      });
      recordsRes.data?.forEach(r => {
        const pName = (r.patients as any)?.full_name || 'Unknown';
        const cat = r.category ? `[${r.category}] ` : '';
        events.push({ id: `rec-${r.id}`, type: 'record', label: `Record uploaded: ${cat}${r.description || 'File'} — ${pName}`, time: r.uploaded_at });
      });

      events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return events.slice(0, 20);
    },
    enabled: profile?.role === 'admin',
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password, full_name, role }: {
      email: string;
      password: string;
      full_name: string;
      role: string;
    }) => {
      if (password.length < 12) {
        throw new Error('Password must be at least 12 characters.');
      }

      const { data, error } = await supabase.rpc('create_staff_member', {
        email_addr: email,
        pwd: password,
        name: full_name,
        usr_role: role,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
  });
}

