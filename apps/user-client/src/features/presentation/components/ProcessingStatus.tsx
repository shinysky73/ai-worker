import type { PresentationState } from '../hooks/usePresentation';

interface ProcessingStatusProps {
  state: PresentationState;
  progress: number;
  error: string | null;
  filename?: string;
}

export function ProcessingStatus({
  state,
  progress,
  error,
  filename,
}: ProcessingStatusProps) {
  const getStatusMessage = () => {
    switch (state) {
      case 'uploading':
        return '파일 업로드 중...';
      case 'processing':
        return '스크립트 생성 중...';
      case 'completed':
        return '완료!';
      case 'error':
        return '오류 발생';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {filename && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="truncate">{filename}</span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusMessage()}
          </span>
          {(state === 'uploading' || state === 'processing') && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {progress}%
            </span>
          )}
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getStatusColor()} ${
              state === 'uploading' || state === 'processing' ? 'animate-pulse' : ''
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {state === 'error' && error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {(state === 'uploading' || state === 'processing') && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>잠시만 기다려 주세요...</span>
        </div>
      )}
    </div>
  );
}
