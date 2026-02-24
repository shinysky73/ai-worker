import axios, { AxiosError } from 'axios';

export type ImageToExcelType = 'receipt' | 'namecard';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface UploadResult {
  id: string;
  totalFiles: number;
  skippedFiles?: string[];
}

export interface ImageStatus {
  filename: string;
  status: ProcessingStatus;
  error?: string;
}

export interface StatusResult {
  id: string;
  status: ProcessingStatus;
  totalFiles: number;
  completedFiles: number;
  images?: ImageStatus[];
  error?: string;
}

export interface ExtractedDataResult {
  type: ImageToExcelType;
  data: Record<string, string>[];
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
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

export const imageToExcelApi = {
  async uploadFiles(
    files: File[],
    type: ImageToExcelType,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('type', type);

    try {
      const response = await axios.post<UploadResult>(
        '/api/image-to-excel/upload',
        formData,
        {
          timeout: REQUEST_TIMEOUT_MS,
          onUploadProgress: options?.onProgress
            ? (progressEvent) => {
                if (progressEvent.total && progressEvent.total > 0) {
                  const percent = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total,
                  );
                  options.onProgress!(percent);
                }
              }
            : undefined,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async pollStatus(id: string): Promise<StatusResult> {
    try {
      const response = await axios.get<StatusResult>(
        `/api/image-to-excel/${id}/status`,
        { timeout: 10_000 },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async fetchExtractedData(id: string): Promise<ExtractedDataResult> {
    try {
      const response = await axios.get<ExtractedDataResult>(
        `/api/image-to-excel/${id}/data`,
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async downloadExcel(id: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `/api/image-to-excel/${id}/download`,
        { responseType: 'blob', timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
