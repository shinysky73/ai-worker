import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImageAnalysis } from './useImageAnalysis';
import { imageAnalysisApi } from '../services/imageAnalysisApi';

vi.mock('../services/imageAnalysisApi');
const mockedApi = vi.mocked(imageAnalysisApi);

// Mock URL.createObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
globalThis.URL.revokeObjectURL = vi.fn();

describe('useImageAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // FR-6 초기 상태
  it('shouldInitializeWithIdleState: 초기 상태는 idle', () => {
    const { result } = renderHook(() => useImageAnalysis());

    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.imagePreviewUrl).toBeNull();
  });

  // FR-6 AC1: 업로드 중 상태 전환
  it('shouldTransitionToUploading: 업로드 시작 시 uploading 상태', async () => {
    const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
    mockedApi.uploadFile.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useImageAnalysis());

    act(() => {
      result.current.upload(mockFile);
    });

    expect(result.current.state).toBe('uploading');
    expect(result.current.imagePreviewUrl).toBe('blob:mock-url');
  });

  // FR-6 AC2: 분석 중 상태 전환
  it('shouldTransitionToProcessing: 업로드 완료 후 processing 상태', async () => {
    const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
    mockedApi.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'chart.png' });
    mockedApi.pollStatus.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.upload(mockFile);
    });

    expect(result.current.state).toBe('processing');
    expect(result.current.message).toBe('이미지를 분석하고 있습니다...');
  });

  // FR-6 AC3: 완료 시 결과 표시
  it('shouldTransitionToCompleted: 분석 완료 시 completed 상태와 결과', async () => {
    const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
    const mockResult = {
      id: 'test-id',
      filename: 'chart.png',
      imageType: 'chart' as const,
      description: '막대 차트',
      insights: ['상승 추세'],
    };

    mockedApi.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'chart.png' });
    mockedApi.pollStatus.mockResolvedValue({
      id: 'test-id',
      status: 'completed',
      progress: 100,
    });
    mockedApi.fetchResult.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.upload(mockFile);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('completed');
    });

    expect(result.current.result).toEqual(mockResult);
  });

  // FR-6 AC4: 에러 발생 시
  it('shouldTransitionToError: 에러 발생 시 error 상태', async () => {
    const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
    mockedApi.uploadFile.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.upload(mockFile);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe('Upload failed');
  });

  // 서버 에러 상태 처리
  it('shouldHandleServerError: 서버에서 error 상태 반환 시 error 전환', async () => {
    const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
    mockedApi.uploadFile.mockResolvedValue({ id: 'test-id', filename: 'chart.png' });
    mockedApi.pollStatus.mockResolvedValue({
      id: 'test-id',
      status: 'error',
      progress: 0,
      error: '분석 실패',
    });

    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.upload(mockFile);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('error');
    });

    expect(result.current.error).toBe('분석 실패');
  });

  // reset 기능
  it('shouldResetState: reset 호출 시 idle 상태로 복원', async () => {
    const mockFile = new File(['test'], 'chart.png', { type: 'image/png' });
    mockedApi.uploadFile.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useImageAnalysis());

    await act(async () => {
      await result.current.upload(mockFile);
    });

    expect(result.current.state).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.imagePreviewUrl).toBeNull();
  });
});
