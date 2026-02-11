import { create } from 'zustand';
import type { DetailLevel, OutputLanguage, ImageAnalysisResult } from '../services/imageAnalysisApi';

export interface ImageAnalysisOptions {
  detailLevel: DetailLevel;
  language: OutputLanguage;
}

interface ImageAnalysisState {
  options: ImageAnalysisOptions;
  result: ImageAnalysisResult | null;
  setOptions: (options: Partial<ImageAnalysisOptions>) => void;
  setResult: (result: ImageAnalysisResult | null) => void;
  reset: () => void;
}

const DEFAULT_OPTIONS: ImageAnalysisOptions = {
  detailLevel: 'detailed',
  language: 'ko',
};

export const useImageAnalysisStore = create<ImageAnalysisState>((set) => ({
  options: { ...DEFAULT_OPTIONS },
  result: null,
  setOptions: (partial) =>
    set((state) => ({
      options: { ...state.options, ...partial },
    })),
  setResult: (result) => set({ result }),
  reset: () => set({ options: { ...DEFAULT_OPTIONS }, result: null }),
}));
