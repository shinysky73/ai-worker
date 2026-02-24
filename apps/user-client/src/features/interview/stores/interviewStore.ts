import { create } from 'zustand';
import type { JobCategory } from '../services/interviewApi';

export interface InterviewOptions {
  jobCategory: JobCategory;
}

interface InterviewState {
  options: InterviewOptions;
  setOptions: (options: Partial<InterviewOptions>) => void;
  reset: () => void;
}

const DEFAULT_OPTIONS: InterviewOptions = {
  jobCategory: '일반/기타',
};

export const useInterviewStore = create<InterviewState>((set) => ({
  options: { ...DEFAULT_OPTIONS },
  setOptions: (partial) =>
    set((state) => ({
      options: { ...state.options, ...partial },
    })),
  reset: () => set({ options: { ...DEFAULT_OPTIONS } }),
}));
