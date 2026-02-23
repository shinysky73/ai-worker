import type { PresentationState } from '../hooks/usePresentation';

interface ProcessingStatusProps {
  state: PresentationState;
  progress: number;
  message: string | null;
  error: string | null;
  filename?: string;
}

export function ProcessingStatus({ state, progress, message, error, filename }: ProcessingStatusProps) {
  if (state === 'idle') return null;

  const isActive = state === 'uploading' || state === 'processing';
  const isError = state === 'error';

  const statusMessage = message || (
    state === 'uploading' ? '파일 업로드 중...' :
    state === 'processing' ? '스크립트 생성 중...' :
    state === 'completed' ? '완료!' : '오류 발생'
  );

  const barColor = isError ? 'bg-red-500' : state === 'completed' ? 'bg-green-500' : 'bg-indigo-500';

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      {/* Spinner or icon */}
      {isActive ? (
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 dark:border-indigo-900/40 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      ) : isError ? (
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ) : null}

      {/* Text */}
      <div className="space-y-1">
        {filename && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{filename}</p>
        )}
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{statusMessage}</p>
      </div>

      {/* Progress bar */}
      {!isError && (
        <div className="w-full max-w-xs space-y-1.5">
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isActive && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{progress}%</p>
          )}
        </div>
      )}

      {/* Error detail */}
      {isError && error && (
        <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
