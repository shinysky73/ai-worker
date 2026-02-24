import { useState, useCallback } from 'react';
import { imageToExcelHistoryApi, type ImageToExcelHistoryItem } from '../services/imageToExcelHistoryApi';

export function useImageToExcelHistory() {
  const [items, setItems] = useState<ImageToExcelHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await imageToExcelHistoryApi.fetchList(page, limit);
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
      await imageToExcelHistoryApi.deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      setError('삭제에 실패했습니다.');
    }
  }, []);

  const downloadExcel = useCallback(async (id: string) => {
    try {
      const blob = await imageToExcelHistoryApi.downloadExcel(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'download.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('다운로드에 실패했습니다.');
    }
  }, []);

  return { items, total, loading, error, fetchList, deleteItem, downloadExcel };
}
