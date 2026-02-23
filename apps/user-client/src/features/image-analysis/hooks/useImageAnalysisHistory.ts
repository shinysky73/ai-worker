import { useState, useCallback } from 'react';
import { imageAnalysisHistoryApi, type ImageAnalysisHistoryItem } from '../services/imageAnalysisHistoryApi';

export function useImageAnalysisHistory() {
  const [items, setItems] = useState<ImageAnalysisHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await imageAnalysisHistoryApi.fetchList(page, limit);
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError('히스토리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await imageAnalysisHistoryApi.deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      setError('삭제에 실패했습니다.');
    }
  }, []);

  return { items, total, loading, error, fetchList, deleteItem };
}
