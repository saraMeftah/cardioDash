import { format } from 'date-fns';
import { supabase } from './supabase';

export const SLOT_TIMES = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00',
];

export function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function displaySlot(date?: string, time?: string) {
  if (!date || !time) return 'Not scheduled';
  return `${format(new Date(`${date}T00:00:00`), 'PPP')} at ${time}`;
}

export async function isSlotAvailable(date: string, time: string, ignoreRequestId?: string) {
  const { data, error } = await supabase.rpc('check_slot_availability', {
    p_date: date,
    p_time: time,
  });

  if (error) throw error;
  if (typeof data === 'boolean') return data;
  return Boolean((data as { available?: boolean } | null)?.available);
}

export async function availableSlotsForDate(date: string) {
  const results = await Promise.all(
    SLOT_TIMES.map(async (time) => ({
      time,
      available: await isSlotAvailable(date, time),
    }))
  );

  return results.filter((slot) => slot.available).map((slot) => slot.time);
}
