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
      <div className="p-6 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error || '오류가 발생했습니다.'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-center mb-4">
        <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
        {message || (state === 'uploading' ? '파일 업로드 중...' : '이미지를 분석하고 있습니다...')}
      </p>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
        {progress}%
      </p>
    </div>
  );
}
