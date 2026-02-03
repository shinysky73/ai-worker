import { useState, useCallback } from 'react';
import {
  presentationApi,
  PresentationResult,
} from '../services/presentationApi';

export type PresentationState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface UsePresentationReturn {
  state: PresentationState;
  progress: number;
  result: PresentationResult | null;
  error: string | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

export function usePresentation(): UsePresentationReturn {
  const [state, setState] = useState<PresentationState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PresentationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [presentationId, setPresentationId] = useState<string | null>(null);

  const pollForCompletion = useCallback(async (id: string) => {
    const status = await presentationApi.pollStatus(id);
    setProgress(status.progress);

    if (status.status === 'completed') {
      const result = await presentationApi.fetchResult(id);
      setResult(result);
      setState('completed');
    } else if (status.status === 'error') {
      setError(status.error || 'Processing failed');
      setState('error');
    } else {
      // Continue polling
      setTimeout(() => pollForCompletion(id), 1000);
    }
  }, []);

  const upload = useCallback(
    async (file: File) => {
      setState('uploading');
      try {
        const uploadResult = await presentationApi.uploadFile(file, {
          onProgress: setProgress,
        });
        setPresentationId(uploadResult.id);
        setState('processing');
        setProgress(0);
        pollForCompletion(uploadResult.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setState('error');
      }
    },
    [pollForCompletion],
  );

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    state,
    progress,
    result,
    error,
    upload,
    reset,
  };
}
