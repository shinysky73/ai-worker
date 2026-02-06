import axios, { AxiosError } from 'axios';

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

export interface SlideResult {
  slideNumber: number;
  script: string;
  estimatedSeconds: number;
  transition?: string;
}

export interface PresentationResult {
  id: string;
  slides: SlideResult[];
  totalEstimatedSeconds: number;
}

export interface UploadFileOptions {
  onProgress?: (percent: number) => void;
  tone?: 'formal' | 'casual';
  targetMinutes?: number;
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

export const presentationApi = {
  async uploadFile(
    file: File,
    options?: UploadFileOptions,
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.tone) {
      formData.append('tone', options.tone);
    }
    if (options?.targetMinutes !== undefined) {
      formData.append('targetMinutes', String(options.targetMinutes));
    }

    try {
      const response = await axios.post<UploadResult>(
        '/api/presentations/upload',
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
        `/api/presentations/${id}/status`,
        { timeout: 10_000 },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async fetchResult(id: string): Promise<PresentationResult> {
    try {
      const response = await axios.get<PresentationResult>(
        `/api/presentations/${id}/result`,
        { timeout: REQUEST_TIMEOUT_MS },
      );
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },
};
