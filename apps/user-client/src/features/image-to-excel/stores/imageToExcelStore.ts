import { create } from 'zustand';
import type { ImageToExcelType } from '../services/imageToExcelApi';

export interface ImageToExcelOptions {
  type: ImageToExcelType;
}

interface ImageToExcelState {
  options: ImageToExcelOptions;
  setOptions: (options: Partial<ImageToExcelOptions>) => void;
  reset: () => void;
}

const DEFAULT_OPTIONS: ImageToExcelOptions = {
  type: 'receipt',
};

export const useImageToExcelStore = create<ImageToExcelState>((set) => ({
  options: { ...DEFAULT_OPTIONS },
  setOptions: (partial) =>
    set((state) => ({
      options: { ...state.options, ...partial },
    })),
  reset: () => set({ options: { ...DEFAULT_OPTIONS } }),
}));
