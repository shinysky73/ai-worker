import { create } from 'zustand';
import { PresentationResult } from '../services/presentationApi';

export interface UploadedFile {
  id: string;
  filename: string;
}

export interface PresentationOptions {
  tone?: 'formal' | 'casual';
  targetMinutes?: number;
}

export interface PresentationState {
  uploadedFile: UploadedFile | null;
  options: PresentationOptions;
  result: PresentationResult | null;
  setUploadedFile: (file: UploadedFile | null) => void;
  setOptions: (options: PresentationOptions) => void;
  setResult: (result: PresentationResult | null) => void;
  reset: () => void;
}

const initialState = {
  uploadedFile: null,
  options: {},
  result: null,
};

export const usePresentationStore = create<PresentationState>((set) => ({
  ...initialState,
  setUploadedFile: (uploadedFile) => set({ uploadedFile }),
  setOptions: (options) => set({ options }),
  setResult: (result) => set({ result }),
  reset: () => set(initialState),
}));
