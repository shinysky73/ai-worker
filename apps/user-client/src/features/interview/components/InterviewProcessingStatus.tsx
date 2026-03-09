import type { InterviewState } from '../hooks/useInterview';

interface InterviewProcessingStatusProps {
  state: InterviewState;
}

export function InterviewProcessingStatus({ state }: InterviewProcessingStatusProps) {
  const message = state === 'submitting'
    ? 'JD를 분석하고 있습니다...'
    : '면접 질문을 생성하고 있습니다...';

  return (
    <div className="flex flex-col items-center py-8 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white animate-spin" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}
