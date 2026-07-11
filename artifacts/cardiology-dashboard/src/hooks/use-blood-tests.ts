import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, type BloodTestEntryMethod, type BloodTestResult, type BloodTestSession } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useBloodTestSessions(patientId?: string) {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['blood_test_sessions', patientId, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('blood_test_sessions')
        .select('*, patients(full_name, card_id)')
        .order('date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else if (profile?.role === 'doctor') {
        const { data: pts } = await supabase.from('patients').select('id').eq('created_by', profile.id);
        const ptIds = pts?.map(p => p.id) || [];
        if (ptIds.length === 0) return [];
        query = query.in('patient_id', ptIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BloodTestSession[];
    },
    enabled: !!user,
  });
}

export function useCreateBloodTestSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      patientId,
      date,
      clinic,
      entryMethod,
      results,
      photo,
    }: {
      patientId: string;
      date: string;
      clinic?: string;
      entryMethod: BloodTestEntryMethod;
      results: BloodTestResult[];
      photo?: File | null;
    }) => {
      const sessionId = crypto.randomUUID();
      let photoUrl: string | null = null;

      if (photo) {
        const ext = photo.name.split('.').pop() || 'jpg';
        const path = `${patientId}/blood-tests/${sessionId}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('medical-records').upload(path, photo);
        if (uploadError) throw uploadError;
        photoUrl = path;
      }

      const { data, error } = await supabase
        .from('blood_test_sessions')
        .insert([{
          patient_id: patientId,
          session_id: sessionId,
          date,
          clinic: clinic?.trim() || null,
          entry_method: entryMethod,
          photo_url: photoUrl,
          results,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as BloodTestSession;
    },
    onSuccess: (_, variables) => {
      toast.success('Bilan sanguin enregistre');
      queryClient.invalidateQueries({ queryKey: ['blood_test_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['blood_test_sessions', variables.patientId] });
    },
    onError: (error: Error) => {
      toast.error(`Enregistrement impossible: ${error.message}`);
    },
  });
}
