import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, type AppointmentRequest } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { combineDateTime, isSlotAvailable } from '@/lib/appointment-requests';

function normalizeRequest(row: any): AppointmentRequest {
  const isPregnant = row.is_pregnant ?? row.pregnancy_status === 'pregnant';
  return {
    ...row,
    full_name: row.full_name ?? row.patient_name,
    phone: row.phone ?? row.contact,
    contact: row.contact ?? row.phone,
    is_pregnant: isPregnant,
    pregnancy_count: row.pregnancy_count ?? row.pregnancies_count,
    note: row.note ?? row.notes,
  } as AppointmentRequest;
}

export function useAppointmentRequests() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['appointment_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(normalizeRequest);
    },
    enabled: !!profile && (profile.role === 'assistant' || profile.role === 'admin' || profile.role === 'doctor'),
  });
}

async function createPatientFromRequest(request: AppointmentRequest, profileId: string) {
  if (request.patient_id) return request.patient_id;

  const { data, error } = await supabase
      .from('patients')
      .insert([{
      full_name: request.full_name,
      phone: request.phone,
      age: request.age,
      gender: request.gender,
      medical_history: request.note || null,
      created_by: profileId,
    }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (request: AppointmentRequest) => {
      if (!profile) throw new Error('You must be signed in.');

      const date = request.suggested_date || request.preferred_date;
      const time = request.suggested_time || request.preferred_time;
      if (!date || !time) throw new Error('Missing appointment date or time.');

      const available = await isSlotAvailable(date, time, request.id);
      if (!available) throw new Error('This slot is no longer available.');

      const patientId = await createPatientFromRequest(request, profile.id);
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id: patientId,
          doctor_id: profile.id,
          date: combineDateTime(date, time).toISOString(),
          status: 'pending',
          notes: request.note || 'Created from online request',
        }])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      const { data, error } = await supabase
        .from('appointment_requests')
        .update({
          status: 'confirmed',
          final_date: date,
          final_time: time,
          patient_id: patientId,
          appointment_id: appointment.id,
        })
        .eq('id', request.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment_requests'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ request, reason }: { request: AppointmentRequest; reason?: string }) => {
      const { data, error } = await supabase
        .from('appointment_requests')
        .update({ status: 'rejected', notes: reason ? `${request.note || ''}\nRejection reason: ${reason}`.trim() : request.note })
        .eq('id', request.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment_requests'] });
    },
  });
}

export function useSuggestRequestTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ request, date, time }: { request: AppointmentRequest; date: string; time: string }) => {
      const available = await isSlotAvailable(date, time, request.id);
      if (!available) throw new Error('This suggested slot is not available.');

      const { data, error } = await supabase
        .from('appointment_requests')
        .update({ status: 'suggested', suggested_date: date, suggested_time: time })
        .eq('id', request.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment_requests'] });
    },
  });
}

export function useMarkRequestDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AppointmentRequest) => {
      if (request.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', request.appointment_id);
      }

      const { data, error } = await supabase
        .from('appointment_requests')
        .update({ status: 'done' })
        .eq('id', request.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment_requests'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('appointment_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment_requests'] });
    },
  });
}

