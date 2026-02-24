import { useState, useCallback, useRef, useEffect } from 'react';
import { imageToExcelApi } from '../services/imageToExcelApi';
import type { ExtractedDataResult } from '../services/imageToExcelApi';
import type { ImageStatus } from '../services/imageToExcelApi';
import { useImageToExcelStore } from '../stores/imageToExcelStore';

export type ExcelState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface UseImageToExcelReturn {
  state: ExcelState;
  progress: number;
  totalFiles: number;
  completedFiles: number;
  images: ImageStatus[];
  result: ExtractedDataResult | null;
  error: string | null;
  upload: (files: File[]) => Promise<void>;
  downloadExcel: () => Promise<void>;
  reset: () => void;
}

const MAX_POLL_ATTEMPTS = 150; // 5 minutes at 2s interval
const POLL_INTERVAL_MS = 2000;

export function useImageToExcel(): UseImageToExcelReturn {
  const [state, setState] = useState<ExcelState>('idle');
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [images, setImages] = useState<ImageStatus[]>([]);
  const [result, setResult] = useState<ExtractedDataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptRef = useRef(0);
  const isMountedRef = useRef(true);
  const currentIdRef = useRef<string | null>(null);

  const { options } = useImageToExcelStore();

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
      const status = await imageToExcelApi.pollStatus(id);
      if (!isMountedRef.current) return;

      setCompletedFiles(status.completedFiles);
      setTotalFiles(status.totalFiles);
      if (status.images) setImages(status.images);

      if (status.totalFiles > 0) {
        setProgress(Math.round((status.completedFiles / status.totalFiles) * 100));
      }

      if (status.status === 'completed') {
        const extractedData = await imageToExcelApi.fetchExtractedData(id);
        if (!isMountedRef.current) return;
        setResult(extractedData);
        setState('completed');
        stopPolling();
      } else if (status.status === 'error') {
        setError(status.error || '처리 중 오류가 발생했습니다.');
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
    async (files: File[]) => {
      setState('uploading');
      setProgress(0);
      setError(null);
      setResult(null);
      setImages([]);
      setCompletedFiles(0);
      setTotalFiles(files.length);

      try {
        const uploadResult = await imageToExcelApi.uploadFiles(files, options.type, {
          onProgress: setProgress,
        });

        if (!isMountedRef.current) return;

        currentIdRef.current = uploadResult.id;
        setState('processing');
        setProgress(0);
        setTotalFiles(uploadResult.totalFiles);
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

  const downloadExcel = useCallback(async () => {
    if (!currentIdRef.current) return;

    try {
      const blob = await imageToExcelApi.downloadExcel(currentIdRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${options.type === 'receipt' ? 'receipts' : 'namecards'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '다운로드에 실패했습니다.');
    }
  }, [options.type]);

  const reset = useCallback(() => {
    stopPolling();
    currentIdRef.current = null;
    setState('idle');
    setProgress(0);
    setTotalFiles(0);
    setCompletedFiles(0);
    setImages([]);
    setResult(null);
    setError(null);
  }, [stopPolling]);

  return {
    state,
    progress,
    totalFiles,
    completedFiles,
    images,
    result,
    error,
    upload,
    downloadExcel,
    reset,
  };
}
