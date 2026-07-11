import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Patient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function usePatients(search?: string, gender?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patients', search, gender, user?.id],
    queryFn: async () => {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('full_name', `%${search}%`);
      }
      if (gender && gender !== 'all') {
        query = query.eq('gender', gender);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!user,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Patient;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patient: Partial<Patient>) => {
      // Always get the current auth user to ensure created_by is set correctly
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated. Please log in again.');

      const { data, error } = await supabase
        .from('patients')
        .insert([{ ...patient, created_by: user.id }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Patient>) => {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
}
