import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { imageAnalysisApi } from './imageAnalysisApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('imageAnalysisApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('shouldUploadFileWithFormData: FormData로 파일 업로드', async () => {
      const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
      mockedAxios.post.mockResolvedValue({
        data: { id: 'test-id', filename: 'chart.png' },
      });

      const result = await imageAnalysisApi.uploadFile(mockFile);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/image-analysis/upload',
        expect.any(FormData),
        expect.objectContaining({ timeout: 60_000 }),
      );
      expect(result.id).toBe('test-id');
      expect(result.filename).toBe('chart.png');
    });

    it('shouldIncludeOptionsInFormData: 옵션을 FormData에 포함', async () => {
      const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
      mockedAxios.post.mockResolvedValue({
        data: { id: 'test-id', filename: 'chart.png' },
      });

      await imageAnalysisApi.uploadFile(mockFile, {
        detailLevel: 'brief',
        language: 'en',
      });

      const formData = mockedAxios.post.mock.calls[0][1] as FormData;
      expect(formData.get('detailLevel')).toBe('brief');
      expect(formData.get('language')).toBe('en');
    });

    it('shouldThrowOnError: API 에러 시 Error throw', async () => {
      const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(
        imageAnalysisApi.uploadFile(mockFile),
      ).rejects.toThrow('Network Error');
    });
  });

  describe('pollStatus', () => {
    it('shouldPollStatus: 상태 폴링 결과 반환', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          id: 'test-id',
          status: 'processing',
          progress: 50,
          message: '분석 중...',
        },
      });

      const result = await imageAnalysisApi.pollStatus('test-id');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/image-analysis/test-id/status',
        expect.objectContaining({ timeout: 10_000 }),
      );
      expect(result.status).toBe('processing');
      expect(result.progress).toBe(50);
    });
  });

  describe('fetchResult', () => {
    it('shouldFetchResult: 분석 결과 조회', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          id: 'test-id',
          imageType: 'table',
          description: '표 설명',
          insights: ['인사이트 1'],
        },
      });

      const result = await imageAnalysisApi.fetchResult('test-id');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/image-analysis/test-id/result',
        expect.objectContaining({ timeout: 60_000 }),
      );
      expect(result.imageType).toBe('table');
      expect(result.insights).toEqual(['인사이트 1']);
    });
  });
});
