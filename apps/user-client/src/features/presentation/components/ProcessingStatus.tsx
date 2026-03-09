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
    state === 'completed' ? '완료' : '오류 발생'
  );

  return (
    <div className="flex flex-col items-center text-center gap-4 py-6">
      {isActive && (
        <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white animate-spin" />
      )}

      <div className="space-y-1">
        {filename && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{filename}</p>
        )}
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{statusMessage}</p>
      </div>

      {!isError && (
        <div className="w-full max-w-xs space-y-1.5">
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 dark:bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {isActive && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{progress}%</p>
          )}
        </div>
      )}

      {isError && error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
