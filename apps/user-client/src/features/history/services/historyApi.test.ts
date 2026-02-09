import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { historyApi } from './historyApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('historyApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchList', () => {
    it('shouldFetchHistoryList: 히스토리 목록 API 호출', async () => {
      const mockResponse = {
        data: {
          items: [{ id: 'h-1', filename: 'a.pptx' }],
          total: 1,
          page: 1,
          limit: 20,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await historyApi.fetchList();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/presentations/history',
        { params: { page: 1, limit: 20 } },
      );
      expect(result.items).toHaveLength(1);
    });

    it('shouldFetchWithPagination: 페이지네이션 파라미터 전달', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [], total: 0, page: 2, limit: 10 } });

      await historyApi.fetchList(2, 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/presentations/history',
        { params: { page: 2, limit: 10 } },
      );
    });
  });

  describe('fetchDetail', () => {
    it('shouldFetchHistoryDetail: 히스토리 상세 API 호출', async () => {
      const mockHistory = { id: 'h-1', filename: 'a.pptx', slides: [] };
      mockedAxios.get.mockResolvedValue({ data: mockHistory });

      const result = await historyApi.fetchDetail('h-1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/presentations/history/h-1');
      expect(result.id).toBe('h-1');
    });
  });

  describe('deleteItem', () => {
    it('shouldDeleteHistoryItem: 히스토리 삭제 API 호출', async () => {
      mockedAxios.delete.mockResolvedValue({ data: {} });

      await historyApi.deleteItem('h-1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/presentations/history/h-1');
    });
  });
});
