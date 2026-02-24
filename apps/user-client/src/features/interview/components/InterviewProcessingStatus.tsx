import type { InterviewState } from '../hooks/useInterview';

interface InterviewProcessingStatusProps {
  state: InterviewState;
}

export function InterviewProcessingStatus({ state }: InterviewProcessingStatusProps) {
  const message = state === 'submitting'
    ? 'JD를 분석하고 있습니다...'
    : 'AI가 면접 질문을 생성하고 있습니다...';

  const subMessage = state === 'submitting'
    ? '채용 공고를 서버로 전송 중입니다.'
    : '직무 역량 분석, 질문 생성, 평가 기준 설정 중입니다. 잠시만 기다려주세요.';

  return (
    <div className="flex flex-col items-center py-8 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-violet-100 dark:border-violet-900/30" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{message}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subMessage}</p>
      </div>
    </div>
  );
}
