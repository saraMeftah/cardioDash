import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, type MedicalRecord } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { processDocumentInBackground } from '@/lib/document-scanner';

export function useMedicalRecords(patientId?: string, category?: string) {
  const { profile, user } = useAuth();

  return useQuery({
    queryKey: ['medical_records', patientId, category, profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('medical_records')
        .select(`*, patients(full_name, card_id)`)
        .order('uploaded_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else if (profile?.role === 'doctor') {
        const { data: pts } = await supabase.from('patients').select('id').eq('created_by', profile.id);
        const ptIds = pts?.map(p => p.id) || [];
        if (ptIds.length > 0) {
          query = query.in('patient_id', ptIds);
        } else {
          return [];
        }
      }

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MedicalRecord[];
    },
    enabled: !!user,
  });
}

export function useUploadRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      patient_id,
      description,
      category,
      notes,
      metrics,
    }: {
      file?: File;
      patient_id: string;
      description: string;
      category: string;
      notes?: string;
      metrics?: Record<string, number>;
    }) => {
      let file_url = '';

      if (file) {
        // Security: validate file type (allow only known safe medical document types)
        const ALLOWED_TYPES = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/tiff',
        ];
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(`File type '${file.type}' is not allowed. Only PDF and images are accepted.`);
        }

        // Security: enforce a 20MB file size limit
        const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
        if (file.size > MAX_SIZE_BYTES) {
          throw new Error('File is too large. Maximum allowed size is 20 MB.');
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        // Path format enforced: {patient_id}/{uuid}.{ext}
        // The storage upload policy validates this path pattern.
        const filePath = `${patient_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-records')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Security: use a short-lived signed URL (1 hour) instead of a permanent
        // public URL. This means even if a URL leaks, it expires quickly.
        // The UI will re-request a new signed URL when displaying records.
        const { data: signedData, error: signedError } = await supabase.storage
          .from('medical-records')
          .createSignedUrl(filePath, 3600); // 1 hour TTL

        if (signedError || !signedData?.signedUrl) {
          throw new Error('Failed to generate secure file URL after upload.');
        }

        // Store the storage PATH (not the signed URL) in the database.
        // The signed URL is ephemeral — we regenerate it when displaying records.
        // Storing the path allows us to always generate a fresh signed URL on read.
        file_url = filePath;
      }

      const { data, error: dbError } = await supabase
        .from('medical_records')
        .insert([{ patient_id, file_url, description, category, notes, metrics }])
        .select()
        .single();

      if (dbError) throw dbError;
      return { data, file };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['medical_records'] });
      
      // BACKGROUND SILENT OCR EXTRACTION
      if (result.file && (result.data.category === 'Bilan' || result.data.category === 'Blood Test') && !result.data.metrics) {
        processDocumentInBackground(result.file).then(extractedMetrics => {
          if (extractedMetrics && Object.keys(extractedMetrics).length > 0) {
            // Update the record silently in the background
            supabase
              .from('medical_records')
              .update({ metrics: extractedMetrics })
              .eq('id', result.data.id)
              .then(() => {
                // Invalidate silently again so charts pickup the new numbers
                queryClient.invalidateQueries({ queryKey: ['medical_records'] });
              });
          }
        });
      }
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medical_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['medical_records'] });
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
      console.error('Delete error', error);
    }
  });
}

/**
 * Generates a short-lived signed URL for a medical record file.
 *
 * file_url in the DB now stores the STORAGE PATH (e.g. "patient-uuid/file-uuid.pdf")
 * rather than a permanent public URL. Call this hook wherever you need to display
 * or link to the file — it regenerates a signed URL with a 1-hour TTL.
 *
 * React Query caches for 50 minutes and re-fetches 10 minutes before the URL expires.
 */
export function useSignedFileUrl(storagePath: string | undefined | null) {
  return useQuery({
    queryKey: ['signed_url', storagePath],
    queryFn: async () => {
      if (!storagePath) return null;

      // If it's already a full URL (legacy records before this migration),
      // return it as-is. After running migration 002, all new records use paths.
      if (storagePath.startsWith('http')) return storagePath;

      const { data, error } = await supabase.storage
        .from('medical-records')
        .createSignedUrl(storagePath, 3600); // 1 hour

      if (error) throw new Error(`Failed to generate file URL: ${error.message}`);
      return data.signedUrl;
    },
    enabled: !!storagePath,
    staleTime: 50 * 60 * 1000,   // Consider fresh for 50 minutes
    gcTime:    60 * 60 * 1000,    // Keep in cache for 60 minutes
  });
}
