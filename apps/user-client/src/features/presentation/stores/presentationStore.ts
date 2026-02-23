import { create } from 'zustand';

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
  setUploadedFile: (file: UploadedFile | null) => void;
  setOptions: (options: PresentationOptions) => void;
  reset: () => void;
}

const initialState = {
  uploadedFile: null,
  options: {},
};

export const usePresentationStore = create<PresentationState>((set) => ({
  ...initialState,
  setUploadedFile: (uploadedFile) => set({ uploadedFile }),
  setOptions: (options) => set({ options }),
  reset: () => set(initialState),
}));
