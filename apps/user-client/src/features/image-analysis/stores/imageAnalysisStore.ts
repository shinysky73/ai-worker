import { create } from 'zustand';
import type { DetailLevel, OutputLanguage } from '../services/imageAnalysisApi';

export interface ImageAnalysisOptions {
  detailLevel: DetailLevel;
  language: OutputLanguage;
}

interface ImageAnalysisState {
  options: ImageAnalysisOptions;
  setOptions: (options: Partial<ImageAnalysisOptions>) => void;
  reset: () => void;
}

const DEFAULT_OPTIONS: ImageAnalysisOptions = {
  detailLevel: 'detailed',
  language: 'ko',
};

export const useImageAnalysisStore = create<ImageAnalysisState>((set) => ({
  options: { ...DEFAULT_OPTIONS },
  setOptions: (partial) =>
    set((state) => ({
      options: { ...state.options, ...partial },
    })),
  reset: () => set({ options: { ...DEFAULT_OPTIONS } }),
}));
