import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { interviewApi } from './interviewApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('interviewApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitJd', () => {
    it('shouldPostJdAndReturnId: JD 텍스트 제출 시 id 반환', async () => {
      mockedAxios.post.mockResolvedValue({ data: { id: 'job-1' } });

      const result = await interviewApi.submitJd('프론트엔드 개발자 채용', '개발');

      expect(result).toEqual({ id: 'job-1' });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/interview/generate',
        { jdText: '프론트엔드 개발자 채용', jobCategory: '개발' },
        { timeout: 60_000 },
      );
    });

    it('shouldExtractErrorMessage: API 에러 시 에러 메시지 추출', async () => {
      const axiosError = new AxiosError('Request failed');
      axiosError.response = {
        data: { message: '채용 공고 내용이 너무 짧습니다 (최소 50자)' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };
      mockedAxios.post.mockRejectedValue(axiosError);

      await expect(interviewApi.submitJd('짧은', '개발')).rejects.toThrow(
        '채용 공고 내용이 너무 짧습니다 (최소 50자)',
      );
    });
  });

  describe('pollStatus', () => {
    it('shouldPollStatusById: ID로 상태 조회', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { id: 'job-1', status: 'completed', result: { competencies: [] } },
      });

      const result = await interviewApi.pollStatus('job-1');

      expect(result.status).toBe('completed');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/interview/job-1/status',
        { timeout: 10_000 },
      );
    });
  });

  describe('downloadExcel', () => {
    it('shouldDownloadExcelBlob: 엑셀 파일 Blob 다운로드', async () => {
      const fakeBlob = new Blob(['excel'], { type: 'application/octet-stream' });
      mockedAxios.get.mockResolvedValue({ data: fakeBlob });

      const result = await interviewApi.downloadExcel('job-1');

      expect(result).toBeInstanceOf(Blob);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/interview/job-1/download',
        { responseType: 'blob', timeout: 60_000 },
      );
    });
  });
});
