import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useInterviewStore } from './interviewStore';

describe('useInterviewStore', () => {
  beforeEach(() => {
    act(() => {
      useInterviewStore.getState().reset();
    });
  });

  it('shouldHaveDefaultOptions: 기본값은 일반/기타', () => {
    const state = useInterviewStore.getState();
    expect(state.options.jobCategory).toBe('일반/기타');
  });

  it('shouldSetOptions: 옵션 변경', () => {
    act(() => {
      useInterviewStore.getState().setOptions({ jobCategory: '개발' });
    });

    const state = useInterviewStore.getState();
    expect(state.options.jobCategory).toBe('개발');
  });

  it('shouldResetToDefault: 리셋 시 기본값 복원', () => {
    act(() => {
      useInterviewStore.getState().setOptions({ jobCategory: '디자인' });
    });
    act(() => {
      useInterviewStore.getState().reset();
    });

    const state = useInterviewStore.getState();
    expect(state.options.jobCategory).toBe('일반/기타');
  });
});
