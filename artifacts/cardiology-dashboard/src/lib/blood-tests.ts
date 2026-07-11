export const DEFAULT_CARDIAC_TESTS: Array<{
  test: string;
  unit: string;
  refMin: number | null;
  refMax: number | null;
  note: string;
}> = [
  { test: 'Troponine I/T', unit: 'ng/L', refMin: 0, refMax: 14, note: 'hs-TnI < 14 ng/L' },
  { test: 'BNP', unit: 'pg/mL', refMin: 0, refMax: 100, note: '< 100' },
  { test: 'NT-proBNP', unit: 'pg/mL', refMin: 0, refMax: 125, note: '< 125 si age < 75 ans' },
  { test: 'CK-MB', unit: 'U/L', refMin: 0, refMax: 25, note: '< 25 U/L' },
  { test: 'D-Dimeres', unit: 'mg/L FEU', refMin: 0, refMax: 0.5, note: '< 0.5' },
  { test: 'LDL Cholesterol', unit: 'g/L', refMin: 0, refMax: 1, note: '< 1.0 g/L' },
  { test: 'HDL Cholesterol', unit: 'g/L', refMin: 0.4, refMax: null, note: '> 0.4 H / > 0.5 F' },
  { test: 'Cholesterol total', unit: 'g/L', refMin: 0, refMax: 2, note: '< 2.0' },
  { test: 'Triglycerides', unit: 'g/L', refMin: 0, refMax: 1.5, note: '< 1.5' },
  { test: 'TP', unit: '%', refMin: 70, refMax: 100, note: '70-100%' },
  { test: 'TCA', unit: 's', refMin: 25, refMax: 35, note: '25-35 s' },
  { test: 'INR', unit: '', refMin: 0.8, refMax: 1.2, note: 'Therapeutique souvent 2-3' },
  { test: 'Glycemie a jeun', unit: 'g/L', refMin: 0.7, refMax: 1.1, note: '0.7-1.1 g/L' },
  { test: 'HbA1c', unit: '%', refMin: 0, refMax: 5.7, note: '< 5.7%' },
];

import type { BloodTestResult, BloodTestStatus } from '@/lib/supabase';

export type BloodTestDraft = Omit<BloodTestResult, 'status'> & { status?: BloodTestStatus };

export function normalizeNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/[<>]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function computeStatus(value: number, refMin?: number | null, refMax?: number | null): BloodTestStatus {
  if (!Number.isFinite(value)) return 'unknown';
  if (typeof refMin === 'number' && value < refMin) return 'low';
  if (typeof refMax === 'number' && value > refMax) return 'high';
  if (typeof refMin !== 'number' && typeof refMax !== 'number') return 'unknown';
  return 'normal';
}

export function finalizeBloodTestResult(draft: BloodTestDraft): BloodTestResult | null {
  const test = draft.test.trim();
  const value = normalizeNumber(draft.value);
  if (!test || value === null) return null;
  const refMin = normalizeNumber(draft.refMin);
  const refMax = normalizeNumber(draft.refMax);
  return {
    test,
    value,
    unit: draft.unit?.trim() || '',
    refMin,
    refMax,
    status: draft.status || computeStatus(value, refMin, refMax),
  };
}

export function statusLabel(status: BloodTestStatus) {
  if (status === 'normal') return 'Normal';
  if (status === 'high') return 'Elevé';
  if (status === 'low') return 'Bas';
  return 'Inconnu';
}
