import axios, { AxiosError } from 'axios';
import type { InterviewQuestionResult } from './interviewApi';

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}

export interface InterviewHistoryItem {
  id: string;
  jdSummary: string;
  jobCategory: string;
  questionsData: InterviewQuestionResult;
  questionCount: number;
  createdAt: string;
}

export interface InterviewHistoryListResponse {
  items: InterviewHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export const interviewHistoryApi = {
  async fetchList(page = 1, limit = 10): Promise<InterviewHistoryListResponse> {
    try {
      const response = await axios.get<InterviewHistoryListResponse>(
        '/api/interview/history',
        { params: { page, limit } },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async fetchDetail(id: string): Promise<InterviewHistoryItem> {
    try {
      const response = await axios.get<InterviewHistoryItem>(
        `/api/interview/history/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      await axios.delete(`/api/interview/history/${id}`);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async downloadExcel(id: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `/api/interview/history/${id}/download`,
        { responseType: 'blob' },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
