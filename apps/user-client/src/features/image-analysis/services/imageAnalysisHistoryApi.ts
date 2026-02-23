import axios, { AxiosError } from 'axios';

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}

export interface ImageAnalysisHistoryItem {
  id: string;
  filename: string;
  imageType: string;
  description: string;
  insights: string[];
  createdAt: string;
}

export interface ImageAnalysisHistoryListResponse {
  items: ImageAnalysisHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export const imageAnalysisHistoryApi = {
  async fetchList(page = 1, limit = 20): Promise<ImageAnalysisHistoryListResponse> {
    try {
      const response = await axios.get<ImageAnalysisHistoryListResponse>(
        '/api/image-analysis/history',
        { params: { page, limit } },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async fetchDetail(id: string): Promise<ImageAnalysisHistoryItem> {
    try {
      const response = await axios.get<ImageAnalysisHistoryItem>(
        `/api/image-analysis/history/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      await axios.delete(`/api/image-analysis/history/${id}`);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async fetchImageBlobUrl(id: string): Promise<string> {
    try {
      const response = await axios.get(`/api/image-analysis/history/${id}/image`, {
        responseType: 'blob',
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
