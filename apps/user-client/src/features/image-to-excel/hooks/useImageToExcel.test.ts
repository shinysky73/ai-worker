import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImageToExcel } from './useImageToExcel';
import { imageToExcelApi } from '../services/imageToExcelApi';

vi.mock('../services/imageToExcelApi');
const mockedApi = vi.mocked(imageToExcelApi);

describe('useImageToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shouldStartIdle: 초기 상태는 idle', () => {
    const { result } = renderHook(() => useImageToExcel());
    expect(result.current.state).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('shouldTransitionToProcessing: upload 호출 후 processing 상태로 전환', async () => {
    mockedApi.uploadFiles.mockResolvedValue({ id: 'uuid-1', totalFiles: 2 });
    mockedApi.pollStatus.mockResolvedValue({
      id: 'uuid-1', status: 'processing', totalFiles: 2, completedFiles: 0,
    });

    const { result } = renderHook(() => useImageToExcel());

    const files = [
      new File(['data1'], 'receipt1.jpg', { type: 'image/jpeg' }),
      new File(['data2'], 'receipt2.jpg', { type: 'image/jpeg' }),
    ];

    await act(async () => {
      result.current.upload(files);
    });

    expect(result.current.state).toBe('processing');
  });

  it('shouldCompleteAfterPolling: 폴링 후 completed 상태로 전환', async () => {
    mockedApi.uploadFiles.mockResolvedValue({ id: 'uuid-1', totalFiles: 1 });
    mockedApi.pollStatus.mockResolvedValue({
      id: 'uuid-1', status: 'completed', totalFiles: 1, completedFiles: 1,
    });
    mockedApi.fetchExtractedData.mockResolvedValue({
      type: 'receipt',
      data: [{ date: '2026-02-23', storeName: '테스트' }],
    });

    const { result } = renderHook(() => useImageToExcel());

    const files = [new File(['data'], 'receipt.jpg', { type: 'image/jpeg' })];

    await act(async () => {
      result.current.upload(files);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('completed');
    });

    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.type).toBe('receipt');
  });

  it('shouldHandleUploadError: 업로드 에러 시 error 상태', async () => {
    mockedApi.uploadFiles.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useImageToExcel());

    const files = [new File(['data'], 'test.jpg', { type: 'image/jpeg' })];

    await act(async () => {
      result.current.upload(files);
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe('Upload failed');
  });

  it('shouldHandlePollingError: 폴링 중 서버 에러', async () => {
    mockedApi.uploadFiles.mockResolvedValue({ id: 'uuid-1', totalFiles: 1 });
    mockedApi.pollStatus.mockResolvedValue({
      id: 'uuid-1', status: 'error', totalFiles: 1, completedFiles: 0, error: 'Server error',
    });

    const { result } = renderHook(() => useImageToExcel());

    const files = [new File(['data'], 'test.jpg', { type: 'image/jpeg' })];

    await act(async () => {
      result.current.upload(files);
    });

    await waitFor(() => {
      expect(result.current.state).toBe('error');
    });

    expect(result.current.error).toBe('Server error');
  });

  it('shouldReset: reset으로 초기 상태로 복구', async () => {
    mockedApi.uploadFiles.mockRejectedValue(new Error('Error'));

    const { result } = renderHook(() => useImageToExcel());

    await act(async () => {
      result.current.upload([new File(['data'], 'test.jpg', { type: 'image/jpeg' })]);
    });

    expect(result.current.state).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });
});
