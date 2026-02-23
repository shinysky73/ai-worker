import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { imageToExcelApi } from './imageToExcelApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('imageToExcelApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFiles', () => {
    it('shouldUploadWithFormData: 파일 배열과 타입을 FormData로 전송', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { id: 'uuid-1', totalFiles: 2 },
      });

      const files = [
        new File(['data1'], 'receipt1.jpg', { type: 'image/jpeg' }),
        new File(['data2'], 'receipt2.jpg', { type: 'image/jpeg' }),
      ];

      const result = await imageToExcelApi.uploadFiles(files, 'receipt');

      expect(result.id).toBe('uuid-1');
      expect(result.totalFiles).toBe(2);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/image-to-excel/upload',
        expect.any(FormData),
        expect.objectContaining({ timeout: 60_000 }),
      );
    });

    it('shouldThrowOnError: 에러 시 메시지 추출하여 throw', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      const files = [new File(['data'], 'test.jpg', { type: 'image/jpeg' })];

      await expect(imageToExcelApi.uploadFiles(files, 'receipt')).rejects.toThrow('Network Error');
    });
  });

  describe('pollStatus', () => {
    it('shouldReturnStatus: 상태 조회 결과 반환', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { id: 'uuid-1', status: 'processing', totalFiles: 3, completedFiles: 1 },
      });

      const result = await imageToExcelApi.pollStatus('uuid-1');

      expect(result.status).toBe('processing');
      expect(result.completedFiles).toBe(1);
    });
  });

  describe('fetchExtractedData', () => {
    it('shouldReturnExtractedData: 추출 데이터 반환', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { type: 'receipt', data: [{ date: '2026-02-23', storeName: '테스트' }] },
      });

      const result = await imageToExcelApi.fetchExtractedData('uuid-1');

      expect(result.type).toBe('receipt');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('downloadExcel', () => {
    it('shouldReturnBlob: 엑셀 파일 Blob 반환', async () => {
      const mockBlob = new Blob(['data'], { type: 'application/octet-stream' });
      mockedAxios.get.mockResolvedValue({ data: mockBlob });

      const result = await imageToExcelApi.downloadExcel('uuid-1');

      expect(result).toBeInstanceOf(Blob);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/image-to-excel/uuid-1/download',
        expect.objectContaining({ responseType: 'blob' }),
      );
    });
  });
});
