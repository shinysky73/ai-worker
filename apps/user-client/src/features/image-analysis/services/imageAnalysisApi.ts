import axios, { AxiosError } from 'axios';

export type ImageType = 'table' | 'chart' | 'other';
export type DetailLevel = 'brief' | 'detailed';
export type OutputLanguage = 'ko' | 'en';

export interface UploadResult {
  id: string;
  filename: string;
}

export interface StatusResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
  error?: string;
}

export interface ImageAnalysisResult {
  id: string;
  filename: string;
  imageType: ImageType;
  description: string;
  insights: string[];
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  detailLevel?: DetailLevel;
  language?: OutputLanguage;
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

export const imageAnalysisApi = {
  async uploadFile(
    file: File,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.detailLevel) {
      formData.append('detailLevel', options.detailLevel);
    }
    if (options?.language) {
      formData.append('language', options.language);
    }

    try {
      const response = await axios.post<UploadResult>(
        '/api/image-analysis/upload',
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
        `/api/image-analysis/${id}/status`,
        { timeout: 10_000 },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async fetchResult(id: string): Promise<ImageAnalysisResult> {
    try {
      const response = await axios.get<ImageAnalysisResult>(
        `/api/image-analysis/${id}/result`,
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
