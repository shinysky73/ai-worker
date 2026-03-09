import type { AnalysisState } from '../hooks/useImageAnalysis';

interface AnalysisStatusProps {
  state: AnalysisState;
  progress: number;
  message: string | null;
  error: string | null;
  onRetry?: () => void;
}

export function AnalysisStatus({
  state,
  progress,
  message,
  error,
  onRetry,
}: AnalysisStatusProps) {
  if (state === 'error') {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error || '오류가 발생했습니다.'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white animate-spin" />

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {message || (state === 'uploading' ? '파일 업로드 중...' : '이미지를 분석하고 있습니다...')}
      </p>

      <div className="w-full max-w-xs space-y-1">
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gray-900 dark:bg-white h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">{progress}%</p>
      </div>
    </div>
  );
}
