import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInterview } from './useInterview';
import { interviewApi } from '../services/interviewApi';
import { useInterviewStore } from '../stores/interviewStore';
import type { InterviewQuestionResult } from '../services/interviewApi';

vi.mock('../services/interviewApi', () => ({
  interviewApi: {
    submitJd: vi.fn(),
    pollStatus: vi.fn(),
    downloadExcel: vi.fn(),
  },
}));

const MOCK_RESULT: InterviewQuestionResult = {
  competencies: [
    {
      name: 'React',
      questions: [
        {
          question: 'React란?',
          intent: '기본 이해도',
          goodAnswerKeywords: ['컴포넌트', 'Virtual DOM'],
          evaluationCriteria: [
            { level: '상', description: '우수' },
            { level: '중', description: '보통' },
            { level: '하', description: '미흡' },
          ],
        },
      ],
    },
    {
      name: 'TypeScript',
      questions: [
        {
          question: 'TS란?',
          intent: 'TS 이해도',
          goodAnswerKeywords: ['타입 안전성'],
          evaluationCriteria: [
            { level: '상', description: '우수' },
            { level: '중', description: '보통' },
            { level: '하', description: '미흡' },
          ],
        },
      ],
    },
    {
      name: '협업',
      questions: [
        {
          question: '협업 경험?',
          intent: '팀워크',
          goodAnswerKeywords: ['소통'],
          evaluationCriteria: [
            { level: '상', description: '우수' },
            { level: '중', description: '보통' },
            { level: '하', description: '미흡' },
          ],
        },
      ],
    },
  ],
  totalQuestions: 3,
  jobCategory: '개발',
  jdSummary: 'React 개발자',
};

describe('useInterview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useInterviewStore.getState().reset();
    });
  });

  it('shouldStartInIdleState: 초기 상태는 idle', () => {
    const { result } = renderHook(() => useInterview());
    expect(result.current.state).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('shouldRejectShortJd: 50자 미만 JD 제출 시 에러', async () => {
    const { result } = renderHook(() => useInterview());

    await act(async () => {
      await result.current.submit('짧은 JD');
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toContain('최소 50자');
  });

  it('shouldSubmitAndPollToCompletion: 제출 → 폴링 → 완료', async () => {
    vi.mocked(interviewApi.submitJd).mockResolvedValue({ id: 'job-1' });
    vi.mocked(interviewApi.pollStatus).mockResolvedValue({
      id: 'job-1',
      status: 'completed',
      result: MOCK_RESULT,
    });

    const { result } = renderHook(() => useInterview());

    await act(async () => {
      await result.current.submit('프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.');
    });

    await waitFor(() => {
      expect(result.current.state).toBe('completed');
    });

    expect(result.current.result).toBeDefined();
    expect(result.current.result!.competencies.length).toBe(3);
  });

  it('shouldHandleSubmitError: 제출 실패 시 에러 상태', async () => {
    vi.mocked(interviewApi.submitJd).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInterview());

    await act(async () => {
      await result.current.submit('프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.');
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error).toBe('Network error');
  });

  it('shouldHandlePollError: 폴링에서 에러 반환 시 에러 상태', async () => {
    vi.mocked(interviewApi.submitJd).mockResolvedValue({ id: 'job-1' });
    vi.mocked(interviewApi.pollStatus).mockResolvedValue({
      id: 'job-1',
      status: 'error',
      error: 'AI 생성 실패',
    });

    const { result } = renderHook(() => useInterview());

    await act(async () => {
      await result.current.submit('프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.');
    });

    await waitFor(() => {
      expect(result.current.state).toBe('error');
    });

    expect(result.current.error).toBe('AI 생성 실패');
  });

  it('shouldResetState: reset 시 idle 상태로 복원', async () => {
    vi.mocked(interviewApi.submitJd).mockResolvedValue({ id: 'job-1' });
    vi.mocked(interviewApi.pollStatus).mockResolvedValue({
      id: 'job-1',
      status: 'completed',
      result: MOCK_RESULT,
    });

    const { result } = renderHook(() => useInterview());

    await act(async () => {
      await result.current.submit('프론트엔드 개발자를 모집합니다. React, TypeScript 경험 3년 이상 우대합니다.');
    });

    await waitFor(() => {
      expect(result.current.state).toBe('completed');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
