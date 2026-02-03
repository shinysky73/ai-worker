import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { presentationApi } from './presentationApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('presentationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('shouldUploadFile: 파일 업로드 API 호출', async () => {
      const mockFile = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const mockResponse = {
        data: { id: 'test-uuid', filename: 'test.pptx' },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await presentationApi.uploadFile(mockFile);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/presentations/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      );
      expect(result).toEqual({ id: 'test-uuid', filename: 'test.pptx' });
    });
  });

  describe('pollStatus', () => {
    it('shouldPollStatus: 상태 폴링 API 호출', async () => {
      const mockResponse = {
        data: { id: 'test-uuid', status: 'processing', progress: 50 },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await presentationApi.pollStatus('test-uuid');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/presentations/test-uuid/status',
      );
      expect(result).toEqual({
        id: 'test-uuid',
        status: 'processing',
        progress: 50,
      });
    });
  });

  describe('fetchResult', () => {
    it('shouldFetchResult: 결과 조회 API 호출', async () => {
      const mockResponse = {
        data: {
          id: 'test-uuid',
          slides: [
            { slideNumber: 1, script: 'First slide script', estimatedSeconds: 20 },
            { slideNumber: 2, script: 'Second slide script', estimatedSeconds: 25 },
          ],
          totalEstimatedSeconds: 45,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await presentationApi.fetchResult('test-uuid');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/presentations/test-uuid/result',
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('uploadFile with progress', () => {
    it('shouldHandleUploadProgress: 업로드 진행률 콜백 호출', async () => {
      const mockFile = new File(['test content'], 'test.pptx', {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const mockResponse = {
        data: { id: 'test-uuid', filename: 'test.pptx' },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const onProgress = vi.fn();
      await presentationApi.uploadFile(mockFile, { onProgress });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/presentations/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: expect.any(Function),
        }),
      );

      // Simulate progress event
      const axiosConfig = mockedAxios.post.mock.calls[0][2];
      const progressEvent = { loaded: 50, total: 100 };
      axiosConfig?.onUploadProgress?.(progressEvent);

      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });
});
