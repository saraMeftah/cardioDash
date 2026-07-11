import { useState, useCallback } from 'react';

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
};

export type Prescription = {
  id: string;
  patient_id?: string;
  patient_name: string;
  patient_card_id?: string;
  patient_age?: string;
  date: string;
  medications: Medication[];
  notes?: string;
  created_at: string;
};

function load(): Prescription[] {
  try { return JSON.parse(localStorage.getItem('prescriptions') || '[]'); }
  catch { return []; }
}

function save(list: Prescription[]) {
  localStorage.setItem('prescriptions', JSON.stringify(list));
}

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(load);

  const addPrescription = useCallback((p: Omit<Prescription, 'id' | 'created_at'>) => {
    const newP: Prescription = {
      ...p,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const updated = [newP, ...prescriptions];
    save(updated);
    setPrescriptions(updated);
    return newP;
  }, [prescriptions]);

  const deletePrescription = useCallback((id: string) => {
    const updated = prescriptions.filter(p => p.id !== id);
    save(updated);
    setPrescriptions(updated);
  }, [prescriptions]);

  return { prescriptions, addPrescription, deletePrescription };
}
