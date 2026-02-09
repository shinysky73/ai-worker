import axios from 'axios';

export interface HistoryItem {
  id: string;
  filename: string;
  tone: string | null;
  targetMinutes: number | null;
  totalEstimatedSeconds: number;
  createdAt: string;
  slides: {
    slideNumber: number;
    script: string;
    estimatedSeconds: number;
    transition?: string;
  }[];
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export const historyApi = {
  async fetchList(page = 1, limit = 20): Promise<HistoryListResponse> {
    const response = await axios.get<HistoryListResponse>(
      '/api/presentations/history',
      { params: { page, limit } },
    );
    return response.data;
  },

  async fetchDetail(id: string): Promise<HistoryItem> {
    const response = await axios.get<HistoryItem>(
      `/api/presentations/history/${id}`,
    );
    return response.data;
  },

  async deleteItem(id: string): Promise<void> {
    await axios.delete(`/api/presentations/history/${id}`);
  },
};
