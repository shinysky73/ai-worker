import type { ImageStatus } from '../services/imageToExcelApi';

interface ProcessingStatusProps {
  progress: number;
  totalFiles: number;
  completedFiles: number;
  images: ImageStatus[];
  error: string | null;
}

export function ProcessingStatus({ progress, totalFiles, completedFiles, images, error }: ProcessingStatusProps) {
  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            처리 중... ({completedFiles}/{totalFiles})
          </span>
          <span className="text-gray-500 dark:text-gray-400">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Individual image statuses */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <StatusIcon status={img.status} />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                {img.filename}
              </span>
              <StatusBadge status={img.status} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  if (status === 'processing') {
    return (
      <svg className="h-4 w-4 text-emerald-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  return <div className="h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    processing: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const labels: Record<string, string> = {
    pending: '대기',
    processing: '처리 중',
    completed: '완료',
    error: '실패',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
