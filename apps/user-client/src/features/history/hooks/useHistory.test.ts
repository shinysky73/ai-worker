import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from './useHistory';
import { historyApi } from '../services/historyApi';

vi.mock('../services/historyApi', () => ({
  historyApi: {
    fetchList: vi.fn(),
    fetchDetail: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

const mockedApi = vi.mocked(historyApi, true);

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shouldStartWithEmptyState: 초기 상태는 빈 목록', () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('shouldFetchList: 목록 조회', async () => {
    const mockItems = [{ id: 'h-1', filename: 'a.pptx' }];
    mockedApi.fetchList.mockResolvedValue({
      items: mockItems as any,
      total: 1,
      page: 1,
      limit: 20,
    });

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchList();
    });

    expect(result.current.items).toEqual(mockItems);
    expect(result.current.total).toBe(1);
  });

  it('shouldHandleFetchError: 조회 실패 시 에러 상태', async () => {
    mockedApi.fetchList.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchList();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.items).toEqual([]);
  });

  it('shouldDeleteItem: 항목 삭제 후 목록에서 제거', async () => {
    const mockItems = [
      { id: 'h-1', filename: 'a.pptx' },
      { id: 'h-2', filename: 'b.pptx' },
    ];
    mockedApi.fetchList.mockResolvedValue({
      items: mockItems as any,
      total: 2,
      page: 1,
      limit: 20,
    });
    mockedApi.deleteItem.mockResolvedValue(undefined);

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchList();
    });
    expect(result.current.items).toHaveLength(2);

    await act(async () => {
      await result.current.deleteItem('h-1');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('h-2');
  });
});
