import axios from 'axios';

export interface UploadResult {
  id: string;
  filename: string;
}

export interface StatusResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export interface SlideResult {
  slideNumber: number;
  script: string;
  estimatedSeconds: number;
}

export interface PresentationResult {
  id: string;
  slides: SlideResult[];
  totalEstimatedSeconds: number;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
}

export const presentationApi = {
  async uploadFile(
    file: File,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadResult>(
      '/api/presentations/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: options?.onProgress
          ? (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total ?? 1),
              );
              options.onProgress!(percent);
            }
          : undefined,
      },
    );

    return response.data;
  },

  async pollStatus(id: string): Promise<StatusResult> {
    const response = await axios.get<StatusResult>(
      `/api/presentations/${id}/status`,
    );
    return response.data;
  },

  async fetchResult(id: string): Promise<PresentationResult> {
    const response = await axios.get<PresentationResult>(
      `/api/presentations/${id}/result`,
    );
    return response.data;
  },
};
