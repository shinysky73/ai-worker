import { useState, useCallback, useRef, useEffect } from 'react';
import { interviewApi } from '../services/interviewApi';
import type { InterviewQuestionResult } from '../services/interviewApi';
import { useInterviewStore } from '../stores/interviewStore';

export type InterviewState =
  | 'idle'
  | 'submitting'
  | 'processing'
  | 'completed'
  | 'error';

export interface UseInterviewReturn {
  state: InterviewState;
  result: InterviewQuestionResult | null;
  error: string | null;
  submit: (jdText: string) => Promise<void>;
  downloadExcel: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
  reset: () => void;
}

const MAX_POLL_ATTEMPTS = 150;
const POLL_INTERVAL_MS = 2000;

export function useInterview(): UseInterviewReturn {
  const [state, setState] = useState<InterviewState>('idle');
  const [result, setResult] = useState<InterviewQuestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptRef = useRef(0);
  const isMountedRef = useRef(true);
  const currentIdRef = useRef<string | null>(null);

  const { options } = useInterviewStore();

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
      const status = await interviewApi.pollStatus(id);
      if (!isMountedRef.current) return;

      if (status.status === 'completed' && status.result) {
        setResult(status.result);
        setState('completed');
        stopPolling();
      } else if (status.status === 'error') {
        setError(status.error || '면접 질문 생성 중 오류가 발생했습니다.');
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

  const submit = useCallback(async (jdText: string) => {
    const trimmed = jdText.trim();
    if (!trimmed || trimmed.length < 50) {
      setError('채용 공고 내용이 너무 짧습니다 (최소 50자)');
      setState('error');
      return;
    }

    setState('submitting');
    setError(null);
    setResult(null);

    try {
      const { id } = await interviewApi.submitJd(trimmed, options.jobCategory);
      if (!isMountedRef.current) return;

      currentIdRef.current = id;
      setState('processing');
      pollAttemptRef.current = 0;
      pollForCompletion(id);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : '제출에 실패했습니다.');
      setState('error');
    }
  }, [pollForCompletion, options]);

  const downloadExcel = useCallback(async () => {
    if (!currentIdRef.current) return;

    try {
      const blob = await interviewApi.downloadExcel(currentIdRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interview_questions.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '다운로드에 실패했습니다.');
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!result) return;

    const lines: string[] = [];
    for (const comp of result.competencies) {
      lines.push(`[${comp.name}]`);
      for (const q of comp.questions) {
        lines.push(`  Q: ${q.question}`);
        lines.push(`  의도: ${q.intent}`);
        lines.push(`  키워드: ${q.goodAnswerKeywords.join(', ')}`);
        for (const ec of q.evaluationCriteria) {
          lines.push(`  ${ec.level}: ${ec.description}`);
        }
        lines.push('');
      }
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch {
      // Fallback: no-op, clipboard not available in some environments
    }
  }, [result]);

  const reset = useCallback(() => {
    stopPolling();
    currentIdRef.current = null;
    setState('idle');
    setResult(null);
    setError(null);
  }, [stopPolling]);

  return {
    state,
    result,
    error,
    submit,
    downloadExcel,
    copyToClipboard,
    reset,
  };
}
