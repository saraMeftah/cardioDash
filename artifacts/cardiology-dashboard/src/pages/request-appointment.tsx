import React, { useState } from 'react';
import { Link } from 'wouter';
import { Activity, Calendar, CheckCircle, Phone, User } from 'lucide-react';
import { supabase, type AppointmentRequest } from '@/lib/supabase';
import { SLOT_TIMES } from '@/lib/appointment-requests';
import { Card, Button, Input, Label, Select, Textarea, Badge } from '@/components/ui';

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  age: '',
  gender: 'male',
  is_pregnant: '',
  pregnancy_count: '',
  preferred_date: '',
  preferred_time: '',
  note: '',
};

const today = () => new Date().toISOString().split('T')[0];

export default function RequestAppointment() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [successRequest, setSuccessRequest] = useState<AppointmentRequest | null>(null);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  // Security: honeypot field — real users never fill this in
  const [honeypot, setHoneypot] = useState('');

  const isFemale = formData.gender === 'female';
  const isPregnant = formData.is_pregnant === 'yes';

  const phoneDigits = (phone: string) => phone.replace(/\D/g, '');
  const isPhoneValid = (phone: string) => /^[+\d\s-]*$/.test(phone) && phoneDigits(phone).length >= 9 && phoneDigits(phone).length <= 15;

  const handlePhoneChange = (value: string) => {
    const digits = phoneDigits(value);
    const hasInvalidChars = /[^+\d\s-]/.test(value);

    if (hasInvalidChars || digits.length > 15) {
      setPhoneError('Phone number must be 9-15 digits');
    } else {
      setPhoneError('');
    }

    if (hasInvalidChars || digits.length > 15) return;
    setFormData({ ...formData, phone: value });
  };

  const validate = () => {
    const age = Number(formData.age);
    if (!formData.full_name.trim()) return 'Full name is required.';
    if (!formData.phone.trim()) return 'Phone number is required.';
    if (!isPhoneValid(formData.phone)) return 'Phone number must be 9-15 digits';
    if (!Number.isInteger(age) || age < 0 || age > 120) return 'Age must be a whole number from 0 to 120.';
    if (!formData.preferred_date || formData.preferred_date < today()) return 'Preferred date cannot be in the past.';
    if (!formData.preferred_time) return 'Preferred time is required.';
    if (isFemale && isPregnant && (!formData.pregnancy_count || Number(formData.pregnancy_count) < 1)) {
      return 'Number of pregnancies is required when pregnant is yes.';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Security: honeypot check — if this field is filled, it's a bot. Silently ignore.
    if (honeypot) {
      setLoading(false);
      // Fake success response so the bot doesn't know it was detected
      setSuccessRequest({ full_name: formData.full_name, created_at: new Date().toISOString() } as AppointmentRequest);
      return;
    }

    try {
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }

      const payload = {
        patient_name: formData.full_name.trim(),
        contact: formData.phone.trim(),
        phone: formData.phone.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        pregnancy_status: isFemale ? (isPregnant ? 'pregnant' : 'not_pregnant') : null,
        pregnancies_count: isFemale && isPregnant ? parseInt(formData.pregnancy_count, 10) : null,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
        notes: formData.note.trim() || null,
        status: 'pending',
      };

      const { error: dbError } = await supabase
        .from('appointment_requests')
        .insert([payload]);

      if (dbError) {
        console.error('Insert error:', dbError);
        throw dbError;
      }

      const request = {
        ...payload,
        full_name: payload.patient_name,
        note: payload.notes || undefined,
        created_at: new Date().toISOString(),
      } as unknown as AppointmentRequest;
      setSuccessRequest(request);
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite lors de la soumission. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (successRequest) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display">Your request has been received</h2>
            <p className="text-muted-foreground mt-2">
              Your request has been received. We will review it and contact you at your provided phone number to confirm your appointment.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData(EMPTY_FORM);
              setSuccessRequest(null);
            }}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Submit another request
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">Demande de Rendez-vous</h1>
        <p className="text-muted-foreground mt-2">Submit a consultation request online</p>
      </div>

      <Card className="max-w-2xl w-full p-6 sm:p-8 shadow-xl border-border/40">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Security: honeypot field — hidden from real users, filled by bots */}
          <input
            type="text"
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
          />
          {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg font-medium">{error}</div>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Full name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input required className="pl-10" placeholder="Ex: Ali Benmoussa" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Phone number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type="tel"
                  inputMode="tel"
                  pattern="[+0-9 \-]*"
                  maxLength={20}
                  className="pl-10"
                  placeholder="Ex: 0555 12 34 56"
                  value={formData.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  aria-invalid={!!phoneError}
                />
              </div>
              {phoneError && <p className="text-xs font-medium text-destructive mt-1">{phoneError}</p>}
            </div>

            <div>
              <Label>Age *</Label>
              <Input required type="number" min="0" max="120" step="1" placeholder="Years" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
            </div>

            <div>
              <Label>Gender *</Label>
              <Select
                required
                value={formData.gender}
                onChange={e => setFormData({
                  ...formData,
                  gender: e.target.value,
                  is_pregnant: e.target.value === 'female' ? formData.is_pregnant : '',
                  pregnancy_count: e.target.value === 'female' ? formData.pregnancy_count : '',
                })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </div>

            {isFemale && (
              <div>
                <Label>Pregnant?</Label>
                <Select
                  value={formData.is_pregnant}
                  onChange={e => setFormData({
                    ...formData,
                    is_pregnant: e.target.value,
                    pregnancy_count: e.target.value === 'yes' ? formData.pregnancy_count : '',
                  })}
                >
                  <option value="">Select...</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Select>
              </div>
            )}

            {isFemale && isPregnant && (
              <div>
                <Label>Number of pregnancies *</Label>
                <Input type="number" min="1" max="30" step="1" value={formData.pregnancy_count} onChange={e => setFormData({ ...formData, pregnancy_count: e.target.value })} />
              </div>
            )}

            <div>
              <Label>Preferred date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input required type="date" className="pl-10" min={today()} value={formData.preferred_date} onChange={e => setFormData({ ...formData, preferred_date: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Preferred time *</Label>
              <Select required value={formData.preferred_time} onChange={e => setFormData({ ...formData, preferred_time: e.target.value })}>
                <option value="">Select time...</option>
                {SLOT_TIMES.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>Note / reason</Label>
              <Textarea placeholder="Symptoms, reason for visit, or scheduling notes..." value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <Badge variant="warning" className="w-fit">Pending clinic confirmation</Badge>
            <Button type="submit" className="h-12 text-base font-bold" disabled={loading}>
              {loading ? 'Sending request...' : 'Send request'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8">
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Accès Personnel Médical
        </Link>
      </div>
    </div>
  );
}
