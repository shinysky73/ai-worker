import axios from 'axios';

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
    const response = await axios.get<ImageAnalysisHistoryListResponse>(
      '/api/image-analysis/history',
      { params: { page, limit } },
    );
    return response.data;
  },

  async fetchDetail(id: string): Promise<ImageAnalysisHistoryItem> {
    const response = await axios.get<ImageAnalysisHistoryItem>(
      `/api/image-analysis/history/${id}`,
    );
    return response.data;
  },

  async deleteItem(id: string): Promise<void> {
    await axios.delete(`/api/image-analysis/history/${id}`);
  },

  async fetchImageBlobUrl(id: string): Promise<string> {
    const response = await axios.get(`/api/image-analysis/history/${id}/image`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },
};
