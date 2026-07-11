import React, { useState } from 'react';
import {
  useAppointmentRequests,
  useApproveRequest,
  useDeleteRequest,
  useMarkRequestDone,
  useRejectRequest,
  useSuggestRequestTime,
} from '@/hooks/use-requests';
import { Card, Button, Badge, Modal, Input, Label, Textarea, Select } from '@/components/ui';
import { Activity, Calendar, Check, Clock, Phone, Send, Trash2, UserPlus, X } from 'lucide-react';
import { displaySlot, SLOT_TIMES } from '@/lib/appointment-requests';
import type { AppointmentRequest } from '@/lib/supabase';

const STATUS_LABELS: Record<AppointmentRequest['status'], string> = {
  pending: 'Pending',
  suggested: 'Suggested',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  done: 'Done',
};

function statusVariant(status: AppointmentRequest['status']) {
  if (status === 'confirmed' || status === 'suggested') return 'teal';
  if (status === 'rejected') return 'destructive';
  if (status === 'done') return 'success';
  return 'warning';
}

export default function Requests() {
  const { data: requests, isLoading } = useAppointmentRequests();
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const suggestTime = useSuggestRequestTime();
  const markDone = useMarkRequestDone();
  const deleteRequest = useDeleteRequest();

  const [rejectTarget, setRejectTarget] = useState<AppointmentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [suggestTarget, setSuggestTarget] = useState<AppointmentRequest | null>(null);
  const [suggestForm, setSuggestForm] = useState({ date: '', time: '' });
  const [suggestionNotice, setSuggestionNotice] = useState<{ phone: string; message: string } | null>(null);
  const [actionError, setActionError] = useState('');
  const [clearTarget, setClearTarget] = useState<AppointmentRequest | null>(null);

  const busy = approveRequest.isPending || rejectRequest.isPending || suggestTime.isPending || markDone.isPending || deleteRequest.isPending;

  const buildSmsMessage = (date: string, time: string) =>
    `Bonjour, votre rendez-vous est confirme pour le ${date} a ${time}. Merci de vous presenter a la clinique a l'heure indiquee.`;

  const buildRejectMessage = () =>
    `Bonjour, nous sommes desoles, votre demande de rendez-vous n'a pas pu etre acceptee pour le moment. Veuillez contacter la clinique pour plus d'informations ou proposer une autre disponibilite.`;

  const runAction = async (action: () => Promise<any>) => {
    setActionError('');
    try {
      await action();
    } catch (err: any) {
      setActionError(err.message || 'Action failed.');
    }
  };

  if (isLoading) {
    return <div className="py-12 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  const pending = requests?.filter(r => r.status === 'pending') || [];
  const suggested = requests?.filter(r => r.status === 'suggested') || [];
  const confirmed = requests?.filter(r => r.status === 'confirmed') || [];
  const rejected = requests?.filter(r => r.status === 'rejected') || [];
  const done = requests?.filter(r => r.status === 'done') || [];

  const RequestCard = ({ req }: { req: AppointmentRequest }) => {
    const requestedSlot = displaySlot(req.preferred_date, req.preferred_time);
    const finalSlot = displaySlot(req.final_date || req.suggested_date || req.preferred_date, req.final_time || req.suggested_time || req.preferred_time);

    return (
      <Card className="p-4 flex flex-col gap-3 border-border/60 hover:shadow-md transition-shadow bg-card">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-foreground truncate">{req.full_name}</h4>
            <p className="text-xs text-muted-foreground">{req.age} years · {req.gender}</p>
          </div>
          <Badge variant={statusVariant(req.status) as any} className="px-2 py-0.5 text-[10px] shrink-0">
            {STATUS_LABELS[req.status]}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" />
            {req.contact || req.phone}
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Requested: <span className="font-medium text-foreground">{requestedSlot}</span>
          </p>
          {(req.suggested_date || req.final_date) && (
            <p className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Final / suggested: <span className="font-medium text-foreground">{finalSlot}</span>
            </p>
          )}
          {req.gender === 'female' && (
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="bg-secondary px-2 py-1 rounded-md">{req.is_pregnant ? 'Pregnant' : 'Not pregnant'}</span>
              {req.is_pregnant && <span className="bg-secondary px-2 py-1 rounded-md">{req.pregnancy_count ?? 0} pregnancies</span>}
            </div>
          )}
          {req.note && <p className="text-xs bg-secondary/50 rounded-lg p-2 mt-2 line-clamp-3">{req.note}</p>}
        </div>

        <div className="mt-2 pt-3 border-t border-border/50 flex flex-wrap gap-2">
          {(req.status === 'pending' || req.status === 'suggested') && (
            <>
              <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-none text-xs h-8" onClick={() => runAction(async () => {
                await approveRequest.mutateAsync(req);
                const date = req.suggested_date || req.preferred_date;
                const time = req.suggested_time || req.preferred_time || '';
                setSuggestionNotice({
                  phone: req.contact || req.phone || 'No phone number',
                  message: buildSmsMessage(date, time),
                });
              })} disabled={busy}>
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => {
                setSuggestTarget(req);
                setSuggestForm({ date: req.preferred_date, time: req.preferred_time || '' });
              }} disabled={busy}>
                <Send className="h-3.5 w-3.5 mr-1" /> Suggest
              </Button>
              <Button size="sm" variant="outline" className="flex-1 hover:bg-destructive/10 hover:text-destructive text-xs h-8" onClick={() => setRejectTarget(req)} disabled={busy}>
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </>
          )}
          {req.status === 'confirmed' && (
            <>
              <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-none text-xs h-8" onClick={() => runAction(() => markDone.mutateAsync(req))} disabled={busy}>
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Mark Done
              </Button>
              <Button size="sm" variant="outline" className="hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-2.5" onClick={() => setClearTarget(req)} disabled={busy} title="Clear request">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {req.status === 'done' && (
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 text-center text-xs font-semibold text-emerald-600 py-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 rounded-lg h-8">
                <Check className="h-3.5 w-3.5" /> Consultation completed
              </div>
              <Button size="sm" variant="outline" className="hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-2.5" onClick={() => setClearTarget(req)} disabled={busy} title="Clear request">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {req.status === 'rejected' && (
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 text-center text-xs font-semibold text-destructive py-1 flex items-center justify-center gap-1.5 bg-destructive/10 rounded-lg h-8">
                <X className="h-3.5 w-3.5" /> Rejected
              </div>
              <Button size="sm" variant="outline" className="hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-2.5" onClick={() => setClearTarget(req)} disabled={busy} title="Clear request">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const Column = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: AppointmentRequest[] }) => (
    <div className="flex flex-col gap-4 bg-secondary/20 rounded-2xl p-4 border border-border/50 min-h-[420px]">
      <h2 className="font-bold flex items-center justify-between border-b border-border pb-3">
        <span className="flex items-center gap-2">{icon} {title}</span>
        <Badge variant="default">{items.length}</Badge>
      </h2>
      {items.map(r => <RequestCard key={r.id} req={r} />)}
      {items.length === 0 && <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-wider font-semibold">No requests.</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Activity className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Online Requests</h1>
          <p className="text-muted-foreground text-sm">Review online appointment requests, confirm slots, suggest another time, or reject requests.</p>
        </div>
      </div>

      {actionError && <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{actionError}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Column title="Pending" icon={<Clock className="h-4 w-4 text-amber-500" />} items={pending} />
        <Column title="Suggested" icon={<Send className="h-4 w-4 text-blue-500" />} items={suggested} />
        <Column title="Confirmed" icon={<Check className="h-4 w-4 text-emerald-500" />} items={confirmed} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Column title="Done" icon={<UserPlus className="h-4 w-4 text-blue-500" />} items={done} />
        <Column title="Rejected" icon={<X className="h-4 w-4 text-destructive" />} items={rejected} />
      </div>

      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Request" size="md">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Reject this online request and keep the reason in the request notes.</p>
          <Textarea placeholder="Optional reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
                disabled={busy || !rejectTarget}
                onClick={() => rejectTarget && runAction(async () => {
                  const phone = rejectTarget.contact || rejectTarget.phone || 'No phone number';
                  await rejectRequest.mutateAsync({ request: rejectTarget, reason: rejectReason });
                  setSuggestionNotice({
                    phone,
                    message: buildRejectMessage(),
                  });
                  setRejectTarget(null);
                  setRejectReason('');
                })}
            >
              Reject request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!suggestTarget} onClose={() => setSuggestTarget(null)} title="Suggest Another Time" size="md">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Save the suggested date and time, then contact the patient by phone.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" min={new Date().toISOString().split('T')[0]} value={suggestForm.date} onChange={e => setSuggestForm({ ...suggestForm, date: e.target.value })} />
            </div>
            <div>
              <Label>Time</Label>
              <Select value={suggestForm.time} onChange={e => setSuggestForm({ ...suggestForm, time: e.target.value })}>
                <option value="">Select time...</option>
                {SLOT_TIMES.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSuggestTarget(null)}>Cancel</Button>
            <Button
              disabled={busy || !suggestTarget || !suggestForm.date || !suggestForm.time}
              onClick={() => suggestTarget && runAction(async () => {
                await suggestTime.mutateAsync({ request: suggestTarget, date: suggestForm.date, time: suggestForm.time });
                setSuggestionNotice({
                  phone: suggestTarget.contact || suggestTarget.phone || 'No phone number',
                  message: buildSmsMessage(suggestForm.date, suggestForm.time),
                });
                setSuggestTarget(null);
              })}
            >
              Send suggestion
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!suggestionNotice} onClose={() => setSuggestionNotice(null)} title="Message ready" size="md">
        {suggestionNotice && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Contact the patient directly:
            </p>
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
                <p className="text-lg font-bold text-foreground mt-1">{suggestionNotice.phone}</p>
              </div>
              <div>
                <Label htmlFor="suggestion-message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</Label>
                <Textarea
                  id="suggestion-message"
                  className="mt-2 min-h-28 bg-background"
                  value={suggestionNotice.message}
                  onChange={e => setSuggestionNotice({ ...suggestionNotice, message: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText(suggestionNotice.message)}
              >
                Copy message
              </Button>
              <Button onClick={() => setSuggestionNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear / Delete confirmation */}
      <Modal isOpen={!!clearTarget} onClose={() => setClearTarget(null)} title="Clear Request" size="md">
        {clearTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete the request from{' '}
              <span className="font-semibold text-foreground">{clearTarget.full_name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setClearTarget(null)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleteRequest.isPending}
                onClick={() => runAction(async () => {
                  await deleteRequest.mutateAsync(clearTarget.id);
                  setClearTarget(null);
                })}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete permanently
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
