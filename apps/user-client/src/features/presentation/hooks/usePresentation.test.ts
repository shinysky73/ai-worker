import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePresentation } from './usePresentation';
import { presentationApi } from '../services/presentationApi';

vi.mock('../services/presentationApi');
const mockedApi = vi.mocked(presentationApi);

describe('usePresentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('shouldInitializeWithIdleState: 초기 상태는 idle', () => {
      const { result } = renderHook(() => usePresentation());

      expect(result.current.state).toBe('idle');
      expect(result.current.progress).toBe(0);
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('upload', () => {
    it('shouldTransitionToUploading: 업로드 시작 시 uploading 상태', async () => {
      const mockFile = new File(['test'], 'test.pptx');
      mockedApi.uploadFile.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => usePresentation());

      act(() => {
        result.current.upload(mockFile);
      });

      expect(result.current.state).toBe('uploading');
    });

    it('shouldTransitionToProcessing: 업로드 완료 후 processing 상태', async () => {
      const mockFile = new File(['test'], 'test.pptx');
      mockedApi.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'test.pptx' });
      mockedApi.pollStatus.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => usePresentation());

      await act(async () => {
        await result.current.upload(mockFile);
      });

      expect(result.current.state).toBe('processing');
    });

    it('shouldTransitionToCompleted: 처리 완료 시 completed 상태', async () => {
      const mockFile = new File(['test'], 'test.pptx');
      const mockResult = {
        id: 'test-id',
        slides: [{ slideNumber: 1, script: 'Script', estimatedSeconds: 20 }],
        totalEstimatedSeconds: 20,
      };

      mockedApi.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'test.pptx' });
      mockedApi.pollStatus.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        progress: 100,
      });
      mockedApi.fetchResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePresentation());

      await act(async () => {
        await result.current.upload(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state).toBe('completed');
      });

      expect(result.current.result).toEqual(mockResult);
    });

    it('shouldTransitionToError: 에러 발생 시 error 상태', async () => {
      const mockFile = new File(['test'], 'test.pptx');
      mockedApi.uploadFile.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => usePresentation());

      await act(async () => {
        await result.current.upload(mockFile);
      });

      expect(result.current.state).toBe('error');
      expect(result.current.error).toBe('Upload failed');
    });

    it('shouldReturnProgress: 업로드/처리 진행률 반환', async () => {
      const mockFile = new File(['test'], 'test.pptx');

      mockedApi.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'test.pptx' });
      mockedApi.pollStatus.mockResolvedValue({
        id: 'test-id',
        status: 'processing',
        progress: 75,
      });

      const { result } = renderHook(() => usePresentation());

      await act(async () => {
        await result.current.upload(mockFile);
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(75);
      });
    });

    it('shouldReturnResult: 완료 시 결과 데이터 반환', async () => {
      const mockFile = new File(['test'], 'test.pptx');
      const mockResult = {
        id: 'test-id',
        slides: [
          { slideNumber: 1, script: 'First slide', estimatedSeconds: 20 },
          { slideNumber: 2, script: 'Second slide', estimatedSeconds: 25 },
        ],
        totalEstimatedSeconds: 45,
      };

      mockedApi.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'test.pptx' });
      mockedApi.pollStatus.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        progress: 100,
      });
      mockedApi.fetchResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePresentation());

      await act(async () => {
        await result.current.upload(mockFile);
      });

      await waitFor(() => {
        expect(result.current.state).toBe('completed');
      });

      expect(result.current.result).toEqual(mockResult);
      expect(result.current.result?.slides).toHaveLength(2);
      expect(result.current.result?.totalEstimatedSeconds).toBe(45);
    });
  });
});
