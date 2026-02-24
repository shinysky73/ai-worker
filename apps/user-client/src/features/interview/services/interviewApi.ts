import axios, { AxiosError } from 'axios';

export type JobCategory = '개발' | '디자인' | '기획/PM' | '마케팅' | '영업' | '일반/기타';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface EvaluationCriteria {
  level: '상' | '중' | '하';
  description: string;
}

export interface InterviewQuestion {
  question: string;
  intent: string;
  goodAnswerKeywords: string[];
  evaluationCriteria: EvaluationCriteria[];
}

export interface Competency {
  name: string;
  questions: InterviewQuestion[];
}

export interface InterviewQuestionResult {
  competencies: Competency[];
  totalQuestions: number;
  jobCategory: JobCategory;
  jdSummary: string;
}

export interface SubmitResult {
  id: string;
}

export interface StatusResult {
  id: string;
  status: ProcessingStatus;
  result?: InterviewQuestionResult;
  error?: string;
}

const REQUEST_TIMEOUT_MS = 60_000;

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}

export const interviewApi = {
  async submitJd(jdText: string, jobCategory: JobCategory): Promise<SubmitResult> {
    try {
      const response = await axios.post<SubmitResult>(
        '/api/interview/generate',
        { jdText, jobCategory },
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async pollStatus(id: string): Promise<StatusResult> {
    try {
      const response = await axios.get<StatusResult>(
        `/api/interview/${id}/status`,
        { timeout: 10_000 },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async downloadExcel(id: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `/api/interview/${id}/download`,
        { responseType: 'blob', timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
