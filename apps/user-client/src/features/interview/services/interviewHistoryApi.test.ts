import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { interviewHistoryApi } from './interviewHistoryApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('interviewHistoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchList', () => {
    it('shouldFetchPaginatedList: 페이지네이션 목록 조회', async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 10 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await interviewHistoryApi.fetchList(1, 10);

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/interview/history',
        { params: { page: 1, limit: 10 } },
      );
    });
  });

  describe('fetchDetail', () => {
    it('shouldFetchDetailById: ID로 상세 조회', async () => {
      const mockDetail = { id: 'h1', jdSummary: '개발자 채용', jobCategory: '개발' };
      mockedAxios.get.mockResolvedValue({ data: mockDetail });

      const result = await interviewHistoryApi.fetchDetail('h1');

      expect(result).toEqual(mockDetail);
    });
  });

  describe('deleteItem', () => {
    it('shouldDeleteById: ID로 삭제', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await interviewHistoryApi.deleteItem('h1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/interview/history/h1');
    });
  });

  describe('downloadExcel', () => {
    it('shouldDownloadExcelBlob: 히스토리 엑셀 다운로드', async () => {
      const fakeBlob = new Blob(['excel']);
      mockedAxios.get.mockResolvedValue({ data: fakeBlob });

      const result = await interviewHistoryApi.downloadExcel('h1');

      expect(result).toBeInstanceOf(Blob);
    });
  });
});
