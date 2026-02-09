import { useState, useCallback } from 'react';
import { historyApi, type HistoryItem } from '../services/historyApi';

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const result = await historyApi.fetchList(page, limit);
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await historyApi.deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setTotal((prev) => prev - 1);
  }, []);

  return { items, total, loading, error, fetchList, deleteItem };
}
