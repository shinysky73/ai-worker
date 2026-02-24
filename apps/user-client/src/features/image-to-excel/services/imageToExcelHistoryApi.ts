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

export interface ImageToExcelHistoryItem {
  id: string;
  type: string;
  imageCount: number;
  extractedData: Record<string, string>[];
  excelFilename: string;
  createdAt: string;
}

export interface ImageToExcelHistoryListResponse {
  items: ImageToExcelHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export const imageToExcelHistoryApi = {
  async fetchList(page = 1, limit = 10): Promise<ImageToExcelHistoryListResponse> {
    try {
      const response = await axios.get<ImageToExcelHistoryListResponse>(
        '/api/image-to-excel/history',
        { params: { page, limit } },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async fetchDetail(id: string): Promise<ImageToExcelHistoryItem> {
    try {
      const response = await axios.get<ImageToExcelHistoryItem>(
        `/api/image-to-excel/history/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      await axios.delete(`/api/image-to-excel/history/${id}`);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async downloadExcel(id: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `/api/image-to-excel/history/${id}/download`,
        { responseType: 'blob' },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
