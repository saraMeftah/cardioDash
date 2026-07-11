import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Security: credentials are NEVER hardcoded. They must be supplied via
// environment variables so they are kept out of version control.
//
// For local development: create .env.local (already in .gitignore) with:
//   VITE_SUPABASE_URL=https://<project>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<your-anon-key>
//
// For production: set these as secrets in your hosting provider's dashboard.
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[CardioDash] Missing Supabase environment variables.\n' +
    'Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'See .env.example for reference.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type User = {
  id: string;
  role: 'admin' | 'doctor' | 'assistant' | 'guest';
  full_name: string;
  phone?: string;
  specialty?: string;
  address?: string;
  avatar_url?: string;
  created_at: string;
};

export type Patient = {
  id: string;
  card_id?: string;
  full_name: string;
  age: number;
  date_of_birth?: string;
  address?: string;
  job?: string;
  phone?: string;
  gender: string;
  medical_history?: string;
  diagnosis?: string;
  medications?: string;
  is_critical?: boolean;
  heart_rate?: number;
  blood_pressure?: string;
  created_by?: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  started_at?: string;
  completed_at?: string;
  patients?: { full_name: string; card_id?: string };
};

export type MedicalRecord = {
  id: string;
  patient_id: string;
  file_url: string;
  description?: string;
  category?: string;
  notes?: string;
  metrics?: Record<string, number>;
  uploaded_at: string;
  patients?: { full_name: string; card_id?: string };
};

export type BloodTestStatus = 'normal' | 'high' | 'low' | 'unknown';
export type BloodTestEntryMethod = 'manual' | 'photo';

export type BloodTestResult = {
  test: string;
  value: number;
  unit?: string;
  refMin?: number | null;
  refMax?: number | null;
  status: BloodTestStatus;
};

export type BloodTestSession = {
  id: string;
  patient_id: string;
  session_id: string;
  date: string;
  clinic?: string | null;
  entry_method: BloodTestEntryMethod;
  photo_url?: string | null;
  results: BloodTestResult[];
  created_at: string;
  patients?: { full_name: string; card_id?: string };
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  created_at: string;
  users?: { full_name: string; role: string };
};

export type AppointmentRequest = {
  id: string;
  full_name: string;
  phone?: string;
  contact?: string;
  age: number;
  gender: 'male' | 'female';
  is_pregnant?: boolean | null;
  pregnancy_count?: number | null;
  preferred_date: string;
  preferred_time?: string;
  requested_at?: string;
  suggested_date?: string;
  suggested_time?: string;
  final_date?: string;
  final_time?: string;
  status: 'pending' | 'confirmed' | 'suggested' | 'rejected' | 'done';
  note?: string;
  public_token?: string;
  appointment_id?: string;
  patient_id?: string;
  created_at: string;
};
