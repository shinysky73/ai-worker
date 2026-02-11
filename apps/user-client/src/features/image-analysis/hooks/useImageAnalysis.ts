import { useState, useCallback, useRef, useEffect } from 'react';
import { imageAnalysisApi } from '../services/imageAnalysisApi';
import type { ImageAnalysisResult } from '../services/imageAnalysisApi';
import { useImageAnalysisStore } from '../stores/imageAnalysisStore';

export type AnalysisState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface UseImageAnalysisReturn {
  state: AnalysisState;
  progress: number;
  message: string | null;
  result: ImageAnalysisResult | null;
  error: string | null;
  imagePreviewUrl: string | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

const MAX_POLL_ATTEMPTS = 120; // 2 minutes at 1s interval
const POLL_INTERVAL_MS = 1000;

export function useImageAnalysis(): UseImageAnalysisReturn {
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptRef = useRef(0);
  const isMountedRef = useRef(true);

  const { options } = useImageAnalysisStore();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      // Clean up object URL
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
      const status = await imageAnalysisApi.pollStatus(id);
      if (!isMountedRef.current) return;

      setProgress(status.progress);
      setMessage(status.message || null);

      if (status.status === 'completed') {
        const analysisResult = await imageAnalysisApi.fetchResult(id);
        if (!isMountedRef.current) return;
        setResult(analysisResult);
        setState('completed');
        stopPolling();
      } else if (status.status === 'error') {
        setError(status.error || '분석에 실패했습니다.');
        setState('error');
        stopPolling();
      } else {
        pollTimerRef.current = setTimeout(() => pollForCompletion(id), POLL_INTERVAL_MS);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : '상태 확인에 실패했습니다.');
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
      setResult(null);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);

      try {
        const uploadResult = await imageAnalysisApi.uploadFile(file, {
          onProgress: setProgress,
          detailLevel: options.detailLevel,
          language: options.language,
        });

        if (!isMountedRef.current) return;

        setState('processing');
        setProgress(0);
        setMessage('이미지를 분석하고 있습니다...');
        pollAttemptRef.current = 0;
        pollForCompletion(uploadResult.id);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
        setState('error');
      }
    },
    [pollForCompletion, options],
  );

  const reset = useCallback(() => {
    stopPolling();
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setState('idle');
    setProgress(0);
    setMessage(null);
    setResult(null);
    setError(null);
    setImagePreviewUrl(null);
  }, [stopPolling, imagePreviewUrl]);

  return {
    state,
    progress,
    message,
    result,
    error,
    imagePreviewUrl,
    upload,
    reset,
  };
}
