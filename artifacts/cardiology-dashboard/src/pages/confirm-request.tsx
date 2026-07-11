import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Card, Button, Skeleton } from '@/components/ui';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';
import { supabase, type AppointmentRequest } from '@/lib/supabase';
import { displaySlot } from '@/lib/appointment-requests';

export default function ConfirmRequest() {
  const [, params] = useRoute('/request/confirm/:id');
  const id = params?.id || '';
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [request, setRequest] = useState<AppointmentRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadRequest() {
      setLoadingRequest(true);
      setError('');
      try {
        const { data, error: loadError } = await supabase
          .from('appointment_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (loadError) throw loadError;
        if (!cancelled) setRequest(data as AppointmentRequest);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Could not load this appointment request.');
      } finally {
        if (!cancelled) setLoadingRequest(false);
      }
    }

    if (id && !token) loadRequest();
    else setLoadingRequest(false);
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error: rpcError } = await supabase.rpc('confirm_appointment_request', {
        request_id: id,
        request_token: token,
      });

      if (rpcError) throw rpcError;
      const confirmedRequest = (Array.isArray(data) ? data[0] : data) as AppointmentRequest;
      setRequest(confirmedRequest);
      setMessage(`Your appointment is confirmed for ${displaySlot(confirmedRequest.final_date, confirmedRequest.final_time)}.`);
    } catch (err: any) {
      setError(err.message || 'We could not confirm this appointment. Please contact the clinic.');
    } finally {
      setLoading(false);
    }
  };

  const suggestedSlot = displaySlot(request?.suggested_date, request?.suggested_time);

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
          <CalendarCheck className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Confirm Appointment Time</h1>
          {loadingRequest ? (
            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mx-auto" />
            </div>
          ) : request?.suggested_date && request?.suggested_time ? (
            <p className="text-sm text-muted-foreground mt-2">
              The clinic suggested {suggestedSlot}. Confirm this time to add the appointment to the clinic agenda.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              This request has no suggested appointment time to confirm.
            </p>
          )}
        </div>

        {message && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-3 text-sm flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" /> {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm flex items-center justify-center gap-2">
            <XCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {!message && (token || (request?.suggested_date && request?.suggested_time)) && (
          <Button className="w-full h-11" onClick={handleConfirm} disabled={loading || !id || !token}>
            {loading ? 'Confirming...' : 'Confirm this appointment'}
          </Button>
        )}
      </Card>
    </div>
  );
}
