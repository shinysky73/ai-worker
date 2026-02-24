import { useState, useCallback } from 'react';
import { interviewHistoryApi, type InterviewHistoryItem } from '../services/interviewHistoryApi';

export function useInterviewHistory() {
  const [items, setItems] = useState<InterviewHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const result = await interviewHistoryApi.fetchList(page, limit);
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await interviewHistoryApi.deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  const downloadExcel = useCallback(async (id: string) => {
    try {
      const blob = await interviewHistoryApi.downloadExcel(id);
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

  return { items, total, loading, error, fetchList, deleteItem, downloadExcel };
}
