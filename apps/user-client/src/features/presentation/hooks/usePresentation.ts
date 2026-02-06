import { useState, useCallback, useRef, useEffect } from 'react';
import { presentationApi } from '../services/presentationApi';
import type { PresentationResult } from '../services/presentationApi';
import { usePresentationStore } from '../stores/presentationStore';

export type PresentationState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface UsePresentationReturn {
  state: PresentationState;
  progress: number;
  message: string | null;
  result: PresentationResult | null;
  error: string | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

const MAX_POLL_ATTEMPTS = 600; // 10 minutes at 1s interval
const POLL_INTERVAL_MS = 1000;

export function usePresentation(): UsePresentationReturn {
  const [state, setState] = useState<PresentationState>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PresentationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptRef = useRef(0);
  const isMountedRef = useRef(true);

  const { options } = usePresentationStore();

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollAttemptRef.current = 0;
  }, []);

  const pollForCompletion = useCallback(async (id: string) => {
    if (!isMountedRef.current) return;

    pollAttemptRef.current++;

    if (pollAttemptRef.current > MAX_POLL_ATTEMPTS) {
      setError('처리 시간이 초과되었습니다. 다시 시도해주세요.');
      setState('error');
      stopPolling();
      return;
    }

    try {
      const status = await presentationApi.pollStatus(id);
      if (!isMountedRef.current) return;

      setProgress(status.progress);
      setMessage(status.message || null);

      if (status.status === 'completed') {
        const result = await presentationApi.fetchResult(id);
        if (!isMountedRef.current) return;
        setResult(result);
        setState('completed');
        stopPolling();
      } else if (status.status === 'error') {
        setError(status.error || 'Processing failed');
        setState('error');
        stopPolling();
      } else {
        pollTimerRef.current = setTimeout(() => pollForCompletion(id), POLL_INTERVAL_MS);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Polling failed');
      setState('error');
      stopPolling();
    }
  }, [stopPolling]);

  const upload = useCallback(
    async (file: File) => {
      setState('uploading');
      setProgress(0);
      setMessage('파일 업로드 중...');
      setError(null);

      try {
        const uploadResult = await presentationApi.uploadFile(file, {
          onProgress: setProgress,
          tone: options.tone,
          targetMinutes: options.targetMinutes,
        });

        if (!isMountedRef.current) return;

        setState('processing');
        setProgress(0);
        setMessage('처리 시작...');
        pollAttemptRef.current = 0;
        pollForCompletion(uploadResult.id);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Upload failed');
        setState('error');
      }
    },
    [pollForCompletion, options],
  );

  const reset = useCallback(() => {
    stopPolling();
    setState('idle');
    setProgress(0);
    setMessage(null);
    setResult(null);
    setError(null);
  }, [stopPolling]);

  return {
    state,
    progress,
    message,
    result,
    error,
    upload,
    reset,
  };
}
