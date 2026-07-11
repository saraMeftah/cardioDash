import React from 'react';
import { useSignedFileUrl } from '@/hooks/use-records';

interface SignedFileLinkProps {
  /** The storage path (e.g. "patient-uuid/file-uuid.pdf") stored in medical_records.file_url */
  storagePath: string | null | undefined;
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders a secure anchor tag with a short-lived signed URL.
 *
 * Use this wherever you previously used <a href={rec.file_url}>.
 * It fetches a fresh signed URL (1-hour TTL) from Supabase Storage before
 * opening, so the link is never a permanent public URL.
 *
 * Falls back gracefully — shows a disabled link if the URL cannot be generated.
 */
export function SignedFileLink({ storagePath, className, children }: SignedFileLinkProps) {
  const { data: signedUrl, isLoading, isError } = useSignedFileUrl(storagePath);

  if (!storagePath) return null;

  if (isLoading) {
    return (
      <span className={className} style={{ opacity: 0.5, cursor: 'wait' }}>
        {children}
      </span>
    );
  }

  if (isError || !signedUrl) {
    return (
      <span
        className={className}
        title="File temporarily unavailable"
        style={{ opacity: 0.4, cursor: 'not-allowed' }}
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
